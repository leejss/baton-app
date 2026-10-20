import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { AppError, normalizeError } from '@/shared/api/errors';

export type AppleCredential = {
  identityToken: string;
  authorizationCode: string;
};

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }
  return AppleAuthentication.isAvailableAsync();
}

function isUserCancellation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message) : '';
  // Expo는 취소를 ERR_REQUEST_CANCELED로 준다. 플랫폼 문구가 바뀌어도 걸리게 넓게 본다.
  return /cancel/i.test(code) || /cancel/i.test(message);
}

export async function signInWithApple(): Promise<AppleCredential> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });

    if (credential.identityToken === null || credential.authorizationCode === null) {
      throw new AppError('unknown', 'Apple에서 인증 정보를 받지 못했어요.');
    }

    return {
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
    };
  } catch (error) {
    if (isUserCancellation(error)) {
      throw new AppError('canceled', '로그인을 취소했어요.', { cause: error });
    }
    throw normalizeError(error);
  }
}
