import { queryOptions } from '@tanstack/react-query';
import {
  fetchInvitationCode,
  fetchMembers,
  fetchMyStore,
  fetchWorkspace,
  searchMembers,
} from '@/features/stores/api/store.api';
export const storeQueries = {
  all: () => ['workspaces'] as const,
  me: () =>
    queryOptions({
      queryKey: ['workspaces', 'memberships'] as const,
      queryFn: ({ signal }) => fetchMyStore(signal),
    }),
  context: (workspaceId: number) =>
    queryOptions({
      queryKey: ['workspaces', workspaceId, 'context'] as const,
      queryFn: ({ signal }) => fetchWorkspace(workspaceId, signal),
      enabled: workspaceId > 0,
    }),
  members: (workspaceId: number) =>
    queryOptions({
      queryKey: ['workspaces', workspaceId, 'members'] as const,
      queryFn: ({ signal }) => fetchMembers(workspaceId, signal),
      enabled: workspaceId > 0,
    }),
  searchMembers: (workspaceId: number, query: string) =>
    queryOptions({
      queryKey: ['workspaces', workspaceId, 'members', query] as const,
      queryFn: ({ signal }) =>
        query.length >= 2
          ? searchMembers(workspaceId, query, signal)
          : fetchMembers(workspaceId, signal),
      enabled: workspaceId > 0,
    }),
  invitationCode: (workspaceId: number) =>
    queryOptions({
      queryKey: ['workspaces', workspaceId, 'invitation'] as const,
      queryFn: ({ signal }) => fetchInvitationCode(workspaceId, signal),
      enabled: workspaceId > 0,
    }),
};
