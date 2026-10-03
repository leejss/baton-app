import { assertAuthRequestAvailable } from '@/features/auth/lib/authRequest';
import { post } from '@/shared/api/client';
import { getDeviceId } from '@/shared/lib/deviceId';

import { sessionSchema, type Session } from '@/features/auth/api/auth.schema';
import type { SignUpParams, SocialSignUpParams } from '@/features/auth/api/signup.schema';

/**
 * 회원가입 API. 경로·필드는 wiki `openapi.yaml`(ADR-026 확정본)을 따른다.
 * 둘 다 `공개` 엔드포인트라 토큰을 싣지 않는다(`auth: false`).
 *
 * 이메일 중복 확인은 별도 엔드포인트가 없다 — `SIGN_UP` 목적의 인증코드 발송
 * (`passwordReset.api`의 `requestVerificationCode`)이 `409 AUTH_ACCOUNT_ALREADY_EXISTS`로 알려준다.
 */

/**
 * 이메일 회원가입. 성공하면 곧바로 로그인 세션이 온다.
 * `409 AUTH_ACCOUNT_ALREADY_EXISTS`는 인증코드 단계에서 이미 걸러지므로 여기서는 throw 그대로 둔다.
 */
export async function signUpWithEmail(
  params: SignUpParams,
  signal?: AbortSignal,
): Promise<Session> {
  assertAuthRequestAvailable(signal);
  const deviceId = await getDeviceId();
  assertAuthRequestAvailable(signal);

  return post('/auth/signup', { ...params, deviceId }, sessionSchema, {
    signal,
    auth: false,
  });
}

/**
 * 소셜 회원가입 완료. 소셜 계정과 Baton 계정을 만들어 연결하고 세션을 발급한다.
 * 서비스 자체 비밀번호는 만들지 않는다(AUTH-13).
 */
export async function signUpWithSocial(
  { provider, ...params }: SocialSignUpParams,
  signal?: AbortSignal,
): Promise<Session> {
  assertAuthRequestAvailable(signal);
  const deviceId = await getDeviceId();
  assertAuthRequestAvailable(signal);

  return post(`/auth/social/${provider}/signup`, { ...params, deviceId }, sessionSchema, {
    signal,
    auth: false,
  });
}
