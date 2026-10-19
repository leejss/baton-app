import { assertAuthRequestAvailable } from '@/features/auth/lib/authRequest';
import { post, postVoid } from '@/shared/api/client';
import { getDeviceId } from '@/shared/lib/deviceId';

import type { AppleCredential } from '@/features/auth/lib/appleAuth';

import {
  socialAuthenticationSchema,
  type SocialSignInOutcome,
} from '@/features/auth/api/auth.schema';

/**
 * 인증 API. 경로·필드는 wiki `openapi.yaml`(ADR-026 확정본)을 따른다.
 * 소셜 인증은 공개 요청이며 로그아웃은 현재 세션으로 요청한다.
 */

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
  // 카카오 SDK에서 받은 토큰을 서버 세션으로 교환한다.
  assertAuthRequestAvailable(signal);
  const deviceId = await getDeviceId();
  assertAuthRequestAvailable(signal);

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
    suggestedDisplayName: result.suggestedDisplayName ?? undefined,
  };
}

/**
 * Apple 자격 증명을 서버로 보내 검증받는다.
 *
 * 카카오와 같은 엔드포인트를 쓰되 싣는 필드가 다르다 — 애플은 `accessToken`이 아니라
 * `identityToken`(검증용 JWT)과 `authorizationCode`(토큰 교환용)를 준다.
 *
 * 서버는 검증한 Apple 식별자와 제공자 이메일로 가입 대기를 만든다.
 * 앱은 닉네임을 별도 입력받으며 이메일을 가입 요청에 넣지 않는다.
 */
export async function authenticateWithApple(
  credential: AppleCredential,
  signal?: AbortSignal,
): Promise<SocialSignInOutcome> {
  assertAuthRequestAvailable(signal);
  const deviceId = await getDeviceId();
  assertAuthRequestAvailable(signal);

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
    suggestedDisplayName: credential.fullName ?? result.suggestedDisplayName ?? undefined,
  };
}

/** 서버 로그아웃 실패 시 세션을 유지해 화면에서 다시 시도할 수 있게 한다. */
export function signOutFromServer(signal?: AbortSignal): Promise<void> {
  return postVoid('/auth/logout', undefined, { signal });
}
