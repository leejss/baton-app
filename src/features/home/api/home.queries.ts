import { queryOptions } from '@tanstack/react-query';
import { fetchHome } from '@/features/home/api/home.api';
export const homeQueries = {
  all: () => ['home'] as const,
  store: (workspaceId: number) => ['home', workspaceId] as const,
  summaryKey: (workspaceId: number, date: string) =>
    [...homeQueries.store(workspaceId), 'summary', date] as const,
  summary: (workspaceId: number, date: string) =>
    queryOptions({
      queryKey: homeQueries.summaryKey(workspaceId, date),
      queryFn: ({ signal }) => fetchHome(workspaceId, date, signal),
    }),
};
