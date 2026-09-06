import { post } from '@/shared/api/client';
import { normalizeError } from '@/shared/api/errors';
import { getDeviceId } from '@/shared/lib/deviceId';

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
    suggestedEmail: result.suggestedEmail,
    suggestedDisplayName: result.suggestedDisplayName,
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
