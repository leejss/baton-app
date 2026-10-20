import { assertAuthRequestAvailable } from '@/features/auth/lib/authRequest';
import { post, postVoid } from '@/shared/api/client';
import { getDeviceId } from '@/shared/lib/deviceId';
import type { AppleCredential } from '@/features/auth/lib/appleAuth';
import { socialAuthenticationSchema } from '@/features/auth/api/auth.schema';

export async function authenticateWithKakao(kakaoAccessToken: string, signal?: AbortSignal) {
  assertAuthRequestAvailable(signal);
  const deviceId = await getDeviceId();
  assertAuthRequestAvailable(signal);
  return post(
    '/auth/social/kakao',
    { accessToken: kakaoAccessToken, deviceId },
    socialAuthenticationSchema,
    { signal, auth: false },
  );
}

export async function authenticateWithApple(credential: AppleCredential, signal?: AbortSignal) {
  assertAuthRequestAvailable(signal);
  const deviceId = await getDeviceId();
  assertAuthRequestAvailable(signal);
  return post('/auth/social/apple', { ...credential, deviceId }, socialAuthenticationSchema, {
    signal,
    auth: false,
  });
}

export function signOutFromServer(signal?: AbortSignal) {
  return postVoid('/auth/logout', undefined, { signal });
}
