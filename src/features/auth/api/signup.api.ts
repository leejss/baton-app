import { assertAuthRequestAvailable } from '@/features/auth/lib/authRequest';
import { post } from '@/shared/api/client';
import { getDeviceId } from '@/shared/lib/deviceId';
import { sessionSchema, type Session } from '@/features/auth/api/auth.schema';
import type { SocialSignUpParams } from '@/features/auth/api/signup.schema';

/** 서버가 검증한 소셜 가입 대기에 닉네임과 약관을 제출한다. 이메일은 제출하지 않는다. */
export async function signUpWithSocial(
  { provider, socialSignupToken, displayName, agreements }: SocialSignUpParams,
  signal?: AbortSignal,
): Promise<Session> {
  assertAuthRequestAvailable(signal);
  const deviceId = await getDeviceId();
  assertAuthRequestAvailable(signal);
  return post(
    `/auth/social/${provider}/signup`,
    { socialSignupToken, displayName, agreements, deviceId },
    sessionSchema,
    { signal, auth: false },
  );
}
