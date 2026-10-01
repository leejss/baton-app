import * as SecureStore from 'expo-secure-store';

import { logger } from '@/shared/lib/logger';

/**
 * 토큰 등 민감정보 전용. 값 자체는 절대 로깅하지 않는다.
 */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      // 저장된 값은 넘기지 않고 읽기 실패만 보고한다.
      logger.error('보안 저장소 읽기 실패', error, { storage_operation: 'read' });
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.error('보안 저장소 저장 실패', error, { storage_operation: 'write' });
      throw error;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error('보안 저장소 삭제 실패', error, { storage_operation: 'delete' });
      throw error;
    }
  },
};
