import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hasServerErrorCode } from '@/shared/api/errors';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  createStore,
  issueInvitationCode,
  joinStore,
  previewStoreInvitation,
} from '@/features/stores/api/store.api';
import { storeQueries } from '@/features/stores/api/store.queries';
import type {
  CreateStoreParams,
  Membership,
  StoreContext,
} from '@/features/stores/api/store.schema';
import { selectWorkspace } from '@/features/stores/store/workspaceSelectionStore';

export const isInvitationInvalid = (error: unknown) =>
  hasServerErrorCode(error, 'WORKSPACE_INVITATION_INVALID');
function useMembershipSuccess() {
  const client = useQueryClient();
  return async (context: StoreContext, userId: number | undefined) => {
    if (!userId || userId !== useAuthStore.getState().session?.user.id) return;
    await client.cancelQueries({ queryKey: storeQueries.me().queryKey, exact: true });
    if (userId !== useAuthStore.getState().session?.user.id) return;
    client.setQueryData(
      storeQueries.me().queryKey,
      (previous: { memberships: Membership[] } | undefined) => ({
        memberships: [
          ...(previous?.memberships ?? []).filter(
            (item) => item.workspace.id !== context.workspace.id,
          ),
          context.membership,
        ],
      }),
    );
    await selectWorkspace(client, userId, context.workspace.id);
    await client.invalidateQueries({ queryKey: storeQueries.me().queryKey });
  };
}
export function useCreateStore() {
  const success = useMembershipSuccess();
  return useMutation({
    mutationFn: (params: CreateStoreParams) => createStore(params),
    onMutate: () => useAuthStore.getState().session?.user.id,
    onSuccess: (context, _params, userId) => success(context, userId),
  });
}
export function usePreviewStoreInvitation() {
  return useMutation({
    mutationFn: ({ token }: { token: string }) => previewStoreInvitation(token),
  });
}
export function useJoinStore() {
  const success = useMembershipSuccess();
  return useMutation({
    mutationFn: ({ token }: { token: string }) => joinStore(token),
    onMutate: () => useAuthStore.getState().session?.user.id,
    onSuccess: (context, _params, userId) => success(context, userId),
  });
}
export function useIssueInvitationCode(workspaceId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => issueInvitationCode(workspaceId),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: storeQueries.invitationCode(workspaceId).queryKey }),
  });
}
