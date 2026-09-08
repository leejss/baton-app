import { post, postVoid } from '@/shared/api/client';
import { normalizeError } from '@/shared/api/errors';
import { getDeviceId } from '@/shared/lib/deviceId';

import type { AppleCredential } from '@/features/auth/lib/appleAuth';

import { mockAuthenticateSocial, mockSignIn, USE_MOCK_AUTH } from '@/features/auth/api/auth.mock';
import {
  sessionSchema,
  socialAuthenticationSchema,
  type SignInOutcome,
  type SocialSignInOutcome,
} from '@/features/auth/api/auth.schema';

/**
 * 인증 API. 경로·필드는 wiki `openapi.yaml`(ADR-026 확정본)을 따른다.
 * 모두 `공개` 엔드포인트라 토큰을 싣지 않는다(`auth: false`).
 */

/** 계약이 `Retry-After`를 안 줬을 때 쓰는 기본 잠금 시간. 정책상 5분이다. */
const DEFAULT_LOCK_SECONDS = 5 * 60;

function toLockedUntil(retryAfterSeconds: number | null): string {
  const seconds = retryAfterSeconds ?? DEFAULT_LOCK_SECONDS;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

/**
 * 카카오 Access Token을 서버로 보내 검증받는다.
 *
 * 연결된 활성 계정이면 세션이 오고, 신규 소셜 식별자면 **로그인이 아니라**
 * 10분짜리 가입 대기 token이 온다(계약 §12-1). 카카오 토큰을 앱이 보관하지 않는 이유는
 * 만료·갱신 책임을 서버 한 곳에 두기 위해서다.
 */
export async function authenticateWithKakao(
  kakaoAccessToken: string,
  signal?: AbortSignal,
): Promise<SocialSignInOutcome> {
  // 카카오 SDK 로그인은 이미 끝난 뒤다. 목이 대신하는 건 서버 토큰 교환뿐이다.
  if (USE_MOCK_AUTH) {
    return mockAuthenticateSocial();
  }

  const deviceId = await getDeviceId();

  const result = await post(
    '/auth/social/kakao',
    { accessToken: kakaoAccessToken, deviceId },
    socialAuthenticationSchema,
    { signal, auth: false },
  );

  if (result.status === 'LOGGED_IN') {
    const { status: _status, ...session } = result;
    return { status: 'signedIn', session };
  }

  return {
    status: 'signupRequired',
    socialSignupToken: result.socialSignupToken,
    expiresAt: result.expiresAt,
    // 화면은 "없음"을 undefined로만 다룬다. null은 여기서 흡수한다.
    suggestedEmail: result.suggestedEmail ?? undefined,
    suggestedDisplayName: result.suggestedDisplayName ?? undefined,
  };
}

/**
 * Apple 자격 증명을 서버로 보내 검증받는다.
 *
 * 카카오와 같은 엔드포인트를 쓰되 싣는 필드가 다르다 — 애플은 `accessToken`이 아니라
 * `identityToken`(검증용 JWT)과 `authorizationCode`(토큰 교환용)를 준다.
 *
 * 이름·이메일은 **최초 인증 때만** 애플이 내려주므로, 있으면 함께 보내 서버가 계정을
 * 만들 때 쓰게 한다. 두 번째부터는 없는 게 정상이라 생략한다.
 */
export async function authenticateWithApple(
  credential: AppleCredential,
  signal?: AbortSignal,
): Promise<SocialSignInOutcome> {
  const deviceId = await getDeviceId();

  const result = await post(
    '/auth/social/apple',
    {
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
      deviceId,
    },
    socialAuthenticationSchema,
    { signal, auth: false },
  );

  if (result.status === 'LOGGED_IN') {
    const { status: _status, ...session } = result;
    return { status: 'signedIn', session };
  }

  return {
    status: 'signupRequired',
    socialSignupToken: result.socialSignupToken,
    expiresAt: result.expiresAt,
    // 애플이 최초 1회만 주는 값이라, 서버가 준 제안값보다 이쪽을 우선한다.
    // 애플이 최초 1회만 주는 값이라 서버 제안값보다 우선한다. null은 흡수한다.
    suggestedEmail: credential.email ?? result.suggestedEmail ?? undefined,
    suggestedDisplayName: credential.fullName ?? result.suggestedDisplayName ?? undefined,
  };
}

/**
 * 이메일 로그인. 사용자당 활성 세션 1개라 새 로그인은 기존 세션을 폐기한다.
 *
 * 자격 증명 불일치(`401`)와 5회 실패 잠금(`429`)은 화면이 필드 문구·카운트다운으로
 * 안내하는 정상 결과라 throw 하지 않고 결과값으로 돌려준다.
 */
export async function signInWithEmail(
  email: string,
  password: string,
  signal?: AbortSignal,
): Promise<SignInOutcome> {
  if (USE_MOCK_AUTH) {
    return mockSignIn(email);
  }

  const deviceId = await getDeviceId();

  try {
    const session = await post('/auth/login', { email, password, deviceId }, sessionSchema, {
      signal,
      auth: false,
    });
    return { status: 'signedIn', session };
  } catch (error) {
    const appError = normalizeError(error);

    if (appError.errorCode === 'AUTH_INVALID_CREDENTIALS') {
      return { status: 'invalidCredentials' };
    }

    if (appError.errorCode === 'AUTH_LOGIN_TEMPORARILY_LOCKED') {
      return { status: 'locked', lockedUntil: toLockedUntil(appError.retryAfterSeconds) };
    }

    throw appError;
  }
}

/**
 * 서버 세션 폐기. 계약상 사용자당 활성 세션이 하나라(ADR-005) 로컬 토큰만 지우면
 * 서버 쪽 세션이 남는다.
 *
 * 실패해도 던지지 않는다 — 네트워크가 끊긴 상태에서도 사용자는 로그아웃돼야 하고,
 * 서버 세션은 만료로 정리된다. "서버 정리 실패" 때문에 앱에 갇히는 쪽이 더 나쁘다.
 */
export async function signOutFromServer(signal?: AbortSignal): Promise<void> {
  try {
    await postVoid('/auth/logout', undefined, { signal });
  } catch {
    // 무시. 호출자는 이 실패로 흐름을 멈추지 않는다.
  }
}
