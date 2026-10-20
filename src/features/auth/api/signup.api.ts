import { assertAuthRequestAvailable } from '@/features/auth/lib/authRequest';
import { post } from '@/shared/api/client';
import { getDeviceId } from '@/shared/lib/deviceId';
import { sessionSchema } from '@/features/auth/api/auth.schema';
import type { SocialSignUpParams } from '@/features/auth/api/signup.schema';

export async function signUpWithSocial(
  { provider, socialSignupToken, displayName, agreements }: SocialSignUpParams,
  signal?: AbortSignal,
) {
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
