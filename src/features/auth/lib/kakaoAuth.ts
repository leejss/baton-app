import { login as kakaoLogin, logout as kakaoLogout } from '@react-native-seoul/kakao-login';

import { AppError, normalizeError } from '@/shared/api/errors';

/**
 * 카카오 SDK를 감싸는 유일한 지점. 화면·훅은 SDK를 직접 import 하지 않는다.
 *
 * `login()`은 카카오톡이 설치돼 있으면 앱 전환으로, 없으면 카카오계정 웹 로그인으로
 * 자동 분기한다. 분기 로직은 SDK가 하므로 우리가 판단하지 않는다.
 */

/** 사용자가 로그인 창을 직접 닫은 경우. 에러 토스트를 띄우면 안 되는 유일한 케이스다. */
function isUserCancellation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message) : '';

  // iOS는 E_CANCELLED_OPERATION, Android는 메시지에 cancel이 섞여 내려온다.
  return /cancel/i.test(code) || /cancel/i.test(message);
}

/**
 * 카카오 로그인을 수행하고 액세스 토큰을 돌려준다.
 * 이 토큰은 저장하지 않고 곧바로 서버에 넘겨 우리 세션으로 교환한다.
 */
export async function signInWithKakao(): Promise<string> {
  try {
    const token = await kakaoLogin();
    if (token.accessToken === undefined || token.accessToken === '') {
      throw new AppError('unknown', '카카오에서 토큰을 받지 못했어요.');
    }
    return token.accessToken;
  } catch (error) {
    if (isUserCancellation(error)) {
      throw new AppError('canceled', '로그인을 취소했어요.', { cause: error });
    }
    throw normalizeError(error);
  }
}

/**
 * 카카오 세션을 끊는다. 실패해도 우리 세션 정리는 계속 진행해야 하므로 던지지 않는다.
 * (카카오 쪽만 남아 있는 것보다 앱이 로그아웃 상태가 되는 게 사용자 기대에 가깝다.)
 */
export async function signOutFromKakao(): Promise<void> {
  try {
    await kakaoLogout();
  } catch {
    // 무시. 호출자는 이 실패로 흐름을 멈추지 않는다.
  }
}
