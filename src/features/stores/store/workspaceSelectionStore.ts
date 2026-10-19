import type { QueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { abortWorkspaceRequests } from '@/shared/api/client';
import { storage } from '@/shared/lib/mmkvStorage';
import { useHandoffDraftStore } from '@/features/handoffs/store/handoffDraftStore';

const key = (userId: number) => `workspace.selected.${userId}`;
export const useWorkspaceSelectionStore = create<{
  selected: Record<number, number | null>;
  select: (userId: number, workspaceId: number | null) => void;
}>((set) => ({
  selected: {},
  select: (userId, workspaceId) => {
    if (workspaceId === null) storage.remove(key(userId));
    else storage.set(key(userId), workspaceId);
    set((state) => ({ selected: { ...state.selected, [userId]: workspaceId } }));
  },
}));
export function selectedWorkspaceId(userId: number): number | undefined {
  return useWorkspaceSelectionStore.getState().selected[userId] ?? storage.getNumber(key(userId));
}
export async function selectWorkspace(
  client: QueryClient,
  userId: number,
  workspaceId: number | null,
) {
  if (workspaceId !== null && selectedWorkspaceId(userId) === workspaceId) return;
  abortWorkspaceRequests();
  useHandoffDraftStore.getState().reset();
  await client.cancelQueries({
    predicate: (query) =>
      query.queryKey[0] !== 'account' &&
      !(query.queryKey[0] === 'workspaces' && query.queryKey[1] === 'memberships'),
  });
  useWorkspaceSelectionStore.getState().select(userId, workspaceId);
}
