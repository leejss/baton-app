import { fetchMembers } from '@/features/stores/api/store.api';
import { AppError } from '@/shared/api/errors';
import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query';
import { fetchHandoffs, fetchHandoff } from '@/features/handoffs/api/handoff.api';
import { toHandoffScopeDto, toRecipientModels } from '@/features/handoffs/api/mappers';
import type { HandoffScope } from '@/features/handoffs/types';
export const handoffQueries = {
  all: () => ['handoffs'] as const,
  store: (workspaceId: number) => ['handoffs', workspaceId] as const,
  lists: (workspaceId: number) => [...handoffQueries.store(workspaceId), 'list'] as const,
  list: (workspaceId: number, userId: number, scope: HandoffScope) =>
    infiniteQueryOptions({
      queryKey: [...handoffQueries.lists(workspaceId), userId, scope],
      initialPageParam: undefined as string | undefined,
      queryFn: async ({ signal, pageParam }) => {
        const page = await fetchHandoffs(workspaceId, toHandoffScopeDto(scope), pageParam, signal);
        if (page.items.some((item) => item.workspaceId !== workspaceId))
          throw new AppError('server', '워크스페이스의 인수인계 목록을 확인할 수 없어요.', {
            status: 403,
            errorCode: 'FORBIDDEN',
          });
        return page;
      },
      getNextPageParam: (page) => (page.hasNext ? (page.nextCursor ?? undefined) : undefined),
    }),
  detail: (workspaceId: number, handoffId: string | number) =>
    queryOptions({
      queryKey: [...handoffQueries.store(workspaceId), 'detail', String(handoffId)],
      queryFn: async ({ signal }) => {
        const handoff = await fetchHandoff(handoffId, signal);
        if (handoff.workspaceId !== workspaceId)
          throw new AppError('server', '다른 워크스페이스의 인수인계예요.', {
            status: 403,
            errorCode: 'FORBIDDEN',
          });
        return handoff;
      },
    }),
  recipientsKey: (workspaceId: number) =>
    [...handoffQueries.store(workspaceId), 'recipients'] as const,
  recipients: (workspaceId: number, userId: number) =>
    queryOptions({
      queryKey: [...handoffQueries.recipientsKey(workspaceId), userId],
      queryFn: async ({ signal }) =>
        toRecipientModels(await fetchMembers(workspaceId, signal), userId),
    }),
};
