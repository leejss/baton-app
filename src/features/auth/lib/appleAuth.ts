import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { AppError, normalizeError } from '@/shared/api/errors';

/**
 * Apple 로그인 SDK를 감싸는 유일한 지점. 화면·훅은 SDK를 직접 import 하지 않는다.
 * 카카오(`kakaoAuth`)와 같은 모양으로 두어 두 소셜 로그인이 같은 방식으로 읽히게 한다.
 *
 * ## 카카오와 다른 점 셋
 *
 * 1. **iOS 전용이다.** `expo-apple-authentication`은 Android를 지원하지 않는다.
 *    안드로이드에서는 버튼을 아예 숨겨야 한다 — `isAppleSignInAvailable()`을 쓴다.
 * 2. **앱에 넣을 키가 없다.** 번들 ID 자체가 식별자이고, 대신 네이티브에
 *    `com.apple.developer.applesignin` entitlement가 박혀 있어야 한다.
 *    (`app.config.ts`의 `expo-apple-authentication` 플러그인이 prebuild 때 넣는다.)
 * 3. **이름·이메일은 최초 인증 1회만 온다.** 아래 주석 참고.
 */

export type AppleCredential = {
  /** 서버가 애플에 검증을 요청할 JWT. */
  identityToken: string;
  /** 서버가 애플 토큰 교환에 쓸 일회성 코드. */
  authorizationCode: string;
  /**
   * ⚠️ **최초 인증 때만 값이 온다.** 두 번째 로그인부터는 애플이 `null`을 준다.
   *
   * 그래서 받은 즉시 서버로 넘겨야 하고, 놓치면 되살릴 방법이 없다
   * (사용자가 iOS 설정 → Apple 계정 → Apple로 로그인에서 앱 사용을 중단해야 초기화된다).
   * 서버가 이미 계정을 갖고 있으면 무시하면 되므로, 있으면 보내고 없으면 생략한다.
   */
  email: string | null;
  fullName: string | null;
};

/** iOS 13 이상에서만 쓸 수 있다. 안드로이드·구버전에서는 버튼을 노출하지 않는다. */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }
  return AppleAuthentication.isAvailableAsync();
}

/** 사용자가 시트를 직접 닫은 경우. 에러 UI를 띄우면 안 되는 유일한 케이스다. */
function isUserCancellation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message) : '';
  // Expo는 취소를 ERR_REQUEST_CANCELED로 준다. 플랫폼 문구가 바뀌어도 걸리게 넓게 본다.
  return /cancel/i.test(code) || /cancel/i.test(message);
}

/** 애플이 이름을 조각으로 준다. 표시용 한 줄로 합친다. 둘 다 없으면 null. */
function toDisplayName(
  name: AppleAuthentication.AppleAuthenticationFullName | null,
): string | null {
  if (name === null) {
    return null;
  }
  const joined = [name.familyName, name.givenName].filter((part) => part !== null).join('');
  return joined === '' ? null : joined;
}

/**
 * Apple 로그인을 수행하고 서버에 넘길 자격 증명을 돌려준다.
 * 카카오와 마찬가지로 이 값은 저장하지 않고 곧바로 서버에 넘겨 우리 세션으로 교환한다.
 */
export async function signInWithApple(): Promise<AppleCredential> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (credential.identityToken === null || credential.authorizationCode === null) {
      throw new AppError('unknown', 'Apple에서 인증 정보를 받지 못했어요.');
    }

    return {
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
      email: credential.email,
      fullName: toDisplayName(credential.fullName),
    };
  } catch (error) {
    if (isUserCancellation(error)) {
      throw new AppError('canceled', '로그인을 취소했어요.', { cause: error });
    }
    throw normalizeError(error);
  }
}
