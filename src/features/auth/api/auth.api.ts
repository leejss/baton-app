import { IS_BACKEND_READY, postJson } from '@/shared/api/client';

import { mockSignIn } from '@/features/auth/api/auth.mock';
import { sessionSchema, type Session, type SignInOutcome } from '@/features/auth/api/auth.schema';

/**
 * ⚠️ 백엔드 미구현.
 *
 * 카카오 로그인은 조용히 성공한 척하지 않고 명시적으로 실패시킨다.
 * 가짜 세션을 만들어 두면 그 상태로 다른 화면을 쌓게 되고, 진짜 붙일 때 전부 다시 손대야 한다.
 * (이메일 로그인도 같은 이유로 목이 절대 성공을 돌려주지 않는다 — `auth.mock.ts` 참고.)
 *
 * 백엔드에 필요한 것:
 *   POST {API_URL}/auth/kakao
 *   요청  { "kakaoAccessToken": "..." }
 *   응답  { accessToken, refreshToken, expiresAt(ISO), user { id, nickname, profileImageUrl } }
 *   서버는 받은 토큰을 카카오 `/v2/user/me`로 검증한 뒤 우리 세션을 발급한다.
 *
 *   POST {API_URL}/auth/login
 *   요청  { "email": "...", "password": "..." }
 *   응답  세션과 같은 형태. 비밀번호 불일치·로그인 제한은 4xx가 아니라
 *        200 + 상태값으로 내려주길 제안한다 — 시안이 이 둘을 배너가 아니라
 *        입력 필드 문구로 안내하기 때문이다.
 */

export async function exchangeKakaoToken(
  kakaoAccessToken: string,
  signal?: AbortSignal,
): Promise<Session> {
  return postJson('/auth/kakao', { kakaoAccessToken }, sessionSchema, signal);
}

export async function signInWithEmail(
  email: string,
  password: string,
  signal?: AbortSignal,
): Promise<SignInOutcome> {
  if (!IS_BACKEND_READY) {
    return mockSignIn();
  }

  const session = await postJson('/auth/login', { email, password }, sessionSchema, signal);
  return { status: 'signedIn', session };
}
