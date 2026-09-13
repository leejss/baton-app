import * as SecureStore from 'expo-secure-store';

import { reportError } from '@/shared/lib/reportError';

/**
 * 토큰 등 민감정보 전용. 값 자체는 절대 로깅하지 않는다.
 */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      // 저장된 값은 넘기지 않고 읽기 실패만 보고한다.
      reportError(error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
