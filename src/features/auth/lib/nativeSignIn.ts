import { AppState } from 'react-native';

import { AppError } from '@/shared/api/errors';
import { assertAuthRequestAvailable } from '@/features/auth/lib/authRequest';

let nativeRequest: Promise<unknown> | null = null;
const FOREGROUND_WAIT_MS = 120_000;

/**
 * SDK에는 진행 중인 인증 창을 닫는 API가 없다. JS 대기를 끝내도 네이티브 요청은
 * 완료될 때까지 점유해 새 인증 창이 겹치지 않게 한다. 이메일 로그인은 계속 사용할 수 있다.
 */
export async function requestNativeSignIn<T>(
  request: () => Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  assertAuthRequestAvailable(signal);
  if (nativeRequest) {
    throw new AppError(
      'unknown',
      '이전 로그인 창을 닫은 뒤 다시 시도해주세요. 계속 기다리는 경우 앱을 다시 실행하거나 이메일로 로그인해주세요.',
    );
  }
  const pending = Promise.resolve().then(() => {
    assertAuthRequestAvailable(signal);
    return request();
  });
  nativeRequest = pending;
  return new Promise<T>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = AppState.addEventListener('change', (state) => {
      clearTimeout(timer);
      // 외부 앱에서 인증하는 시간은 제한하지 않는다. 앱 복귀 후 콜백 누락만 복구한다.
      if (state === 'active') startTimer();
    });
    const cleanup = () => {
      clearTimeout(timer);
      subscription.remove();
      signal.removeEventListener('abort', cancel);
    };
    const cancel = () => {
      cleanup();
      reject(new AppError('canceled', '로그인을 취소했어요.'));
    };
    const startTimer = () => {
      timer = setTimeout(() => {
        cleanup();
        reject(
          new AppError(
            'timeout',
            '인증 결과를 받지 못했어요. 로그인 창을 닫아주세요. 계속되지 않으면 앱을 다시 실행하거나 이메일로 로그인해주세요.',
          ),
        );
      }, FOREGROUND_WAIT_MS);
    };
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
    else if (AppState.currentState === 'active') startTimer();
    pending.then(
      (value) => {
        if (nativeRequest === pending) nativeRequest = null;
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        if (nativeRequest === pending) nativeRequest = null;
        cleanup();
        reject(error);
      },
    );
  });
}
