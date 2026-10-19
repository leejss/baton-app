import { beforeEach, expect, it, jest } from '@jest/globals';
import { QueryClient } from '@tanstack/react-query';
import {
  selectWorkspace,
  selectedWorkspaceId,
  useWorkspaceSelectionStore,
} from '@/features/stores/store/workspaceSelectionStore';
import { abortWorkspaceRequests } from '@/shared/api/client';
import { useHandoffDraftStore } from '@/features/handoffs/store/handoffDraftStore';
import { storage } from '@/shared/lib/mmkvStorage';
jest.mock('@/shared/api/client', () => ({ abortWorkspaceRequests: jest.fn() }));
jest.mock('@/shared/lib/mmkvStorage', () => {
  const values = new Map();
  return {
    storage: {
      getNumber: (key: string) => values.get(key),
      set: (key: string, value: unknown) => values.set(key, value),
      remove: (key: string) => values.delete(key),
      clearAll: () => values.clear(),
    },
  };
});
beforeEach(() => {
  jest.clearAllMocks();
  storage.clearAll();
  useWorkspaceSelectionStore.setState({ selected: {} });
  useHandoffDraftStore.getState().reset();
});
it('사용자마다 현재 공간을 따로 저장한다', () => {
  useWorkspaceSelectionStore.getState().select(1, 101);
  useWorkspaceSelectionStore.getState().select(2, 202);
  expect(selectedWorkspaceId(1)).toBe(101);
  expect(selectedWorkspaceId(2)).toBe(202);
  useWorkspaceSelectionStore.setState({ selected: {} });
  expect(selectedWorkspaceId(1)).toBe(101);
});
it('공간을 전환하면 요청을 취소하고 이전 인수인계 초안을 초기화한다', async () => {
  const client = new QueryClient();
  useHandoffDraftStore.getState().setContent('작성 중', '공간 A 내용');
  await selectWorkspace(client, 1, 202);
  expect(abortWorkspaceRequests).toHaveBeenCalledTimes(1);
  expect(useHandoffDraftStore.getState().title).toBe('');
  expect(useHandoffDraftStore.getState().attachments).toEqual([]);
  expect(selectedWorkspaceId(1)).toBe(202);
  client.clear();
});
