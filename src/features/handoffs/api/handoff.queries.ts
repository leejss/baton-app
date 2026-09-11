import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query";
import {
  fetchHandoffs,
  fetchHandoff,
  fetchRecommendation,
} from "@/features/handoffs/api/handoff.api";
import {
  toHandoffScopeDto,
  toRecipientModels,
} from "@/features/handoffs/api/mappers";
import { storeQueries } from "@/features/stores/api/store.queries";
import type { HandoffScope } from "@/features/handoffs/types";
export const handoffQueries = {
  all: () => ["handoffs"] as const,
  store: (storeId: number) => ["handoffs", storeId] as const,
  lists: (storeId: number) =>
    [...handoffQueries.store(storeId), "list"] as const,
  list: (storeId: number, userId: number, scope: HandoffScope) =>
    infiniteQueryOptions({
      queryKey: [...handoffQueries.lists(storeId), userId, scope],
      initialPageParam: undefined as string | undefined,
      queryFn: ({ signal, pageParam }) =>
        fetchHandoffs(storeId, toHandoffScopeDto(scope), pageParam, signal),
      getNextPageParam: (page) =>
        page.hasNext ? (page.nextCursor ?? undefined) : undefined,
    }),
  detail: (storeId: number, handoffId: string | number) =>
    queryOptions({
      queryKey: [...handoffQueries.store(storeId), "detail", String(handoffId)],
      queryFn: ({ signal }) => fetchHandoff(handoffId, signal),
    }),
  recipientsKey: (storeId: number) =>
    [...handoffQueries.store(storeId), "recipients"] as const,
  recipients: (storeId: number, userId: number) =>
    queryOptions({
      queryKey: [...handoffQueries.recipientsKey(storeId), userId],
      queryFn: async ({ signal, client }) => {
        const [recommendation, members] = await Promise.all([
          fetchRecommendation(storeId, signal),
          client.fetchQuery(storeQueries.members(storeId)),
        ]);
        return toRecipientModels(recommendation, members, userId);
      },
    }),
};
