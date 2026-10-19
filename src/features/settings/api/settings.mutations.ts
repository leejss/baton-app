import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  fetchWorkspace,
  leaveStore,
  transferManager,
  updateMemberRole,
} from '@/features/stores/api/store.api';
import { storeQueries } from '@/features/stores/api/store.queries';
import { selectWorkspace } from '@/features/stores/store/workspaceSelectionStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { AppError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/lib/routes';
export async function leaveCurrentStore(workspaceId: number, _userId: number) {
  const { membership } = await fetchWorkspace(workspaceId);
  if (membership.status !== 'ACTIVE')
    throw new AppError('server', '현재 워크스페이스 참여를 확인할 수 없어요.');
  return leaveStore(workspaceId);
}
export function useLeaveCurrentStore(workspaceId: number, userId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => leaveCurrentStore(workspaceId, userId),
    onSuccess: async () => {
      if (useAuthStore.getState().session?.user.id !== userId) return;
      await selectWorkspace(client, userId, null);
      client.setQueryData(
        storeQueries.me().queryKey,
        (
          previous:
            | { memberships: import('@/features/stores/api/store.schema').Membership[] }
            | undefined,
        ) => ({
          memberships: (previous?.memberships ?? []).filter(
            (item) => item.workspace.id !== workspaceId,
          ),
        }),
      );
      await client.invalidateQueries({ queryKey: storeQueries.all() });
      router.replace(ROUTES.workspaces);
    },
  });
}
export function useTransferManager(workspaceId: number, onTransferred: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => transferManager(workspaceId, userId),
    onSuccess: async () => {
      onTransferred();
      await client.invalidateQueries({ queryKey: storeQueries.all() });
    },
  });
}
export function useUpdateMemberRole(workspaceId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'ADMIN' | 'MEMBER' }) =>
      updateMemberRole(workspaceId, userId, role),
    onSuccess: () => client.invalidateQueries({ queryKey: storeQueries.all() }),
  });
}
