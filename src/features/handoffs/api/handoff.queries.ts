import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query';
import {
  fetchHandoffs,
  fetchHandoff,
  fetchRecommendation,
} from '@/features/handoffs/api/handoff.api';
import { toHandoffScopeDto, toRecipientModels } from '@/features/handoffs/api/mappers';
import type { HandoffScope } from '@/features/handoffs/types';
export const handoffQueries = {
  all: () => ['handoffs'] as const,
  store: (storeId: number) => ['handoffs', storeId] as const,
  lists: (storeId: number) => [...handoffQueries.store(storeId), 'list'] as const,
  list: (storeId: number, userId: number, scope: HandoffScope) =>
    infiniteQueryOptions({
      queryKey: [...handoffQueries.lists(storeId), userId, scope],
      initialPageParam: undefined as string | undefined,
      queryFn: ({ signal, pageParam }) =>
        fetchHandoffs(storeId, toHandoffScopeDto(scope), pageParam, signal),
      getNextPageParam: (page) => (page.hasNext ? (page.nextCursor ?? undefined) : undefined),
    }),
  detail: (storeId: number, handoffId: string | number) =>
    queryOptions({
      queryKey: [...handoffQueries.store(storeId), 'detail', String(handoffId)],
      queryFn: ({ signal }) => fetchHandoff(handoffId, signal),
    }),
  recipientsKey: (storeId: number) => [...handoffQueries.store(storeId), 'recipients'] as const,
  recipients: (storeId: number, userId: number, workDate?: string) =>
    queryOptions({
      queryKey: [...handoffQueries.recipientsKey(storeId), userId, workDate ?? null],
      queryFn: async ({ signal }) => {
        // 근무표에서 진입하면 선택한 날짜 전체의 후보를 조회한다.
        const referenceAt = workDate ? `${workDate}T00:00:00+09:00` : undefined;
        const recommendation = await fetchRecommendation(storeId, referenceAt, signal);
        return toRecipientModels(recommendation, userId);
      },
    }),
};
