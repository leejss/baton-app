import * as SecureStore from 'expo-secure-store';

import { logger } from '@/shared/lib/logger';

/**
 * 토큰 등 민감정보 전용. 값 자체는 절대 로깅하지 않는다.
 */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // 값 자체는 절대 로깅하지 않는다. 실패 사실과 키 이름만 남긴다.
      logger.warn('secure storage read failed', { key, ok: false });
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
