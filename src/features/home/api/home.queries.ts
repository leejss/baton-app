import { queryOptions } from '@tanstack/react-query';

import type { HomeDataSource } from '@/features/home/api/home.dataSource';
import { homeSummaryResponseSchema } from '@/features/home/api/home.schema';

export const homeQueries = {
  all: () => ['home'] as const,
  summaryKey: (storeId: number, date: string) =>
    [...homeQueries.all(), 'summary', storeId, date] as const,

  summary: (dataSource: HomeDataSource, storeId: number, date: string) =>
    queryOptions({
      queryKey: homeQueries.summaryKey(storeId, date),
      queryFn: async ({ signal }) => {
        const response = homeSummaryResponseSchema.parse(
          await dataSource.getHome(storeId, date, signal),
        );
        if (response.meta.result !== 'SUCCESS') {
          throw new Error(response.meta.message ?? '홈 정보를 불러오지 못했습니다.');
        }
        return response.data;
      },
    }),
};
