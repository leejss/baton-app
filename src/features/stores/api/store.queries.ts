import { queryOptions } from '@tanstack/react-query';
import { fetchMyStore, fetchMembers } from '@/features/stores/api/store.api';
export const storeQueries = {
  all: () => ['stores'] as const,
  me: () =>
    queryOptions({
      queryKey: ['stores', 'me'] as const,
      queryFn: ({ signal }) => fetchMyStore(signal),
    }),
  members: (storeId: number) =>
    queryOptions({
      queryKey: ['stores', storeId, 'members'] as const,
      queryFn: ({ signal }) => fetchMembers(storeId, signal),
      enabled: storeId > 0,
    }),
};
