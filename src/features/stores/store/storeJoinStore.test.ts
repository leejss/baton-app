import { beforeEach, expect, it, jest } from '@jest/globals';
import { invitationToken, useStoreJoinStore } from '@/features/stores/store/storeJoinStore';
import { secureStorage } from '@/shared/lib/secureStorage';
jest.mock('@/shared/lib/secureStorage', () => ({
  secureStorage: {
    get: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
    set: jest.fn<() => Promise<void>>().mockResolvedValue(),
    remove: jest.fn<() => Promise<void>>().mockResolvedValue(),
  },
}));
beforeEach(() => {
  jest.clearAllMocks();
  useStoreJoinStore.setState({ token: null, preview: null, hydrated: false });
});
it('받은 초대 링크에서 URL-safe 토큰만 읽는다', () => {
  expect(invitationToken('baton://workspace/join?token=random_123-xyz')).toBe('random_123-xyz');
  expect(invitationToken('https://example.com?token=random_123')).toBeNull();
  expect(invitationToken('baton://workspace/join?token=bad%20token')).toBeNull();
});
it('로그인 전 보관한 토큰을 앱 재시작 뒤 복원한다', async () => {
  await useStoreJoinStore.getState().setToken('random_123');
  expect(secureStorage.set).toHaveBeenCalledWith('workspace.pending-invitation', 'random_123');
  useStoreJoinStore.setState({ token: null, hydrated: false });
  jest.mocked(secureStorage.get).mockResolvedValue('random_123');
  await useStoreJoinStore.getState().restore();
  expect(useStoreJoinStore.getState()).toMatchObject({ token: 'random_123', hydrated: true });
});
it('참여 완료나 취소 후에는 저장한 링크를 지운다', async () => {
  await useStoreJoinStore.getState().clear();
  expect(secureStorage.remove).toHaveBeenCalledWith('workspace.pending-invitation');
  expect(useStoreJoinStore.getState().token).toBeNull();
});
