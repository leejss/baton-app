import * as Application from 'expo-application';
import { Platform } from 'react-native';

import { storage } from '@/shared/lib/mmkvStorage';

/**
 * 설치 식별자. 계약의 `deviceId`(1~200자)로 로그인·소셜 인증·가입에 함께 보낸다.
 *
 * 사용자당 활성 세션이 하나라 서버가 이 값으로 "같은 기기의 재로그인"과
 * "다른 기기에서의 로그인"을 구분한다([ADR-005](wiki `decisions/ADR-005-single-device-session.md`)).
 *
 * OS가 주는 벤더 식별자를 우선 쓰되, 한 번 정해지면 그 값을 저장해 고정한다 —
 * iOS 벤더 ID는 같은 회사 앱을 모두 지우면 바뀌는데, 그때 세션이 조용히 갈리는 걸 막는다.
 * 민감정보가 아니므로 secure-store가 아니라 mmkv에 둔다.
 */
const DEVICE_ID_KEY = 'device.id';

/** OS가 식별자를 주지 않을 때 쓰는 대체값. 보안용이 아니라 충돌만 피하면 된다. */
function createFallbackId(): string {
  return `fallback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function readNativeId(): Promise<string | null> {
  try {
    return Platform.OS === 'android'
      ? Application.getAndroidId()
      : await Application.getIosIdForVendorAsync();
  } catch {
    return null;
  }
}

export async function getDeviceId(): Promise<string> {
  const cached = storage.getString(DEVICE_ID_KEY);
  if (cached !== undefined && cached !== '') {
    return cached;
  }

  const deviceId = (await readNativeId()) ?? createFallbackId();
  storage.set(DEVICE_ID_KEY, deviceId);
  return deviceId;
}
