import { disableCurrentPushToken, registerPushToken } from '@/features/notifications/api/push.api';
import type { PushTokenRequest } from '@/features/notifications/api/push.schema';
import { logger } from '@/shared/lib/logger';

let pending = Promise.resolve();
let generation = 0;
let paused = false;
let registered: string | undefined;

export function resumePushRegistration() {
  paused = false;
  registered = undefined;
}

/** 진행 중인 등록이 끝난 뒤 비활성화해야 로그아웃 도중 다시 활성화되는 경쟁을 막는다. */
export async function pausePushRegistration() {
  paused = true;
  generation += 1;
  registered = undefined;
  await pending;
}

export function syncPushToken(userId: number, request: PushTokenRequest, signal: AbortSignal) {
  const currentGeneration = generation;
  const key = `${userId}:${request.platform}:${request.token}`;
  const result = pending.then(async () => {
    if (paused || signal.aborted || currentGeneration !== generation || registered === key) return;
    await registerPushToken(request, signal);
    if (!signal.aborted && currentGeneration === generation) registered = key;
    logger.info('푸시 토큰 서버 등록 완료', { platform: request.platform });
  });
  // 이전 요청 실패가 다음 재시도를 막지 않게 한다. 실패는 호출자에게 그대로 전달한다.
  pending = result.catch(() => {});
  return result;
}

export function forgetPushRegistration() {
  generation += 1;
  registered = undefined;
}

export function disablePushRegistration(signal: AbortSignal) {
  forgetPushRegistration();
  // 권한 철회 직전의 POST가 DELETE보다 늦게 끝나 다시 활성화하지 않도록 순서를 보장한다.
  const result = pending.then(async () => {
    if (!signal.aborted) await disableCurrentPushToken(signal);
  });
  pending = result.catch(() => {});
  return result;
}
