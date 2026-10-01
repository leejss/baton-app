import { beforeEach, expect, it, jest } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import { logger } from '@/shared/lib/logger';
import { secureStorage } from '@/shared/lib/secureStorage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('@/shared/lib/logger', () => ({ logger: { error: jest.fn() } }));
beforeEach(() => {
  jest.clearAllMocks();
});

it('읽기 실패는 값 없이 진단을 남기고 세션 복원을 중단시키지 않는다', async () => {
  const error = Object.assign(new Error('missing entitlement'), { code: 'ERR_SECURESTORE' });
  jest.mocked(SecureStore.getItemAsync).mockRejectedValue(error);
  await expect(secureStorage.get('auth.session')).resolves.toBeNull();
  expect(logger.error).toHaveBeenCalledWith('보안 저장소 읽기 실패', error, {
    storage_operation: 'read',
  });
});

it('저장 실패는 작업만 진단하고 호출자에게 전달해 로그인 성공으로 처리하지 않는다', async () => {
  const error = new Error('keychain unavailable');
  jest.mocked(SecureStore.setItemAsync).mockRejectedValue(error);
  await expect(secureStorage.set('auth.session', 'private-session-value')).rejects.toBe(error);
  expect(logger.error).toHaveBeenCalledWith('보안 저장소 저장 실패', error, {
    storage_operation: 'write',
  });
  expect(JSON.stringify(jest.mocked(logger.error).mock.calls)).not.toContain(
    'private-session-value',
  );
});

it('삭제 실패도 작업을 기록하고 호출자에게 전달한다', async () => {
  const error = new Error('keychain unavailable');
  jest.mocked(SecureStore.deleteItemAsync).mockRejectedValue(error);
  await expect(secureStorage.remove('auth.session')).rejects.toBe(error);
  expect(logger.error).toHaveBeenCalledWith('보안 저장소 삭제 실패', error, {
    storage_operation: 'delete',
  });
});
