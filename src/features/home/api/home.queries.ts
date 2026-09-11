import { queryOptions } from '@tanstack/react-query';
import { fetchHome } from '@/features/home/api/home.api';
export const homeQueries = {
  all: () => ['home'] as const,
  store: (storeId: number) => ['home', storeId] as const,
  summaryKey: (storeId: number, date: string) =>
    [...homeQueries.store(storeId), 'summary', date] as const,
  summary: (storeId: number, date: string) =>
    queryOptions({
      queryKey: homeQueries.summaryKey(storeId, date),
      queryFn: ({ signal }) => fetchHome(storeId, date, signal),
    }),
};
