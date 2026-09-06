import { queryOptions } from '@tanstack/react-query';

import { HomeDataSourceError, type HomeDataSource } from '@/features/home/api/home.dataSource';
import {
  homeSummaryResponseSchema,
  myStoreResponseSchema,
  notificationListResponseSchema,
  userProfileResponseSchema,
} from '@/features/home/api/home.schema';

function assertSuccess(result: 'SUCCESS' | 'FAIL', message: string | null, fallback: string) {
  if (result !== 'SUCCESS') {
    throw new Error(message ?? fallback);
  }
}

export const homeQueries = {
  all: () => ['home'] as const,

  context: (dataSource: HomeDataSource) =>
    queryOptions({
      queryKey: [...homeQueries.all(), 'context'] as const,
      queryFn: async ({ signal }) => {
        const [profileResponse, storeResponse] = await Promise.all([
          dataSource.getMyProfile(signal),
          dataSource.getMyStore(signal),
        ]);
        const profile = userProfileResponseSchema.parse(profileResponse);
        const store = myStoreResponseSchema.parse(storeResponse);

        assertSuccess(
          profile.meta.result,
          profile.meta.message,
          '사용자 정보를 불러오지 못했습니다.',
        );
        assertSuccess(store.meta.result, store.meta.message, '매장 정보를 불러오지 못했습니다.');

        const membership = store.data.membership;

        if (
          membership === undefined ||
          membership.status !== 'ACTIVE' ||
          membership.store.status !== 'ACTIVE'
        ) {
          throw new HomeDataSourceError(
            'HOME_CONTEXT_UNAVAILABLE',
            '홈 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
          );
        }

        return { profile: profile.data, membership };
      },
    }),

  summaryKey: (storeId: number, date: string) =>
    [...homeQueries.all(), 'summary', storeId, date] as const,

  summary: (dataSource: HomeDataSource, storeId: number, date: string) =>
    queryOptions({
      queryKey: homeQueries.summaryKey(storeId, date),
      queryFn: async ({ signal }) => {
        const response = homeSummaryResponseSchema.parse(
          await dataSource.getHome(storeId, date, signal),
        );
        assertSuccess(
          response.meta.result,
          response.meta.message,
          '홈 정보를 불러오지 못했습니다.',
        );
        return response.data;
      },
    }),

  notifications: (dataSource: HomeDataSource, storeId: number) =>
    queryOptions({
      queryKey: [...homeQueries.all(), 'notifications', storeId] as const,
      queryFn: async ({ signal }) => {
        const response = notificationListResponseSchema.parse(
          await dataSource.getNotifications(storeId, signal),
        );
        assertSuccess(response.meta.result, response.meta.message, '알림을 불러오지 못했습니다.');
        return response.data;
      },
    }),
};
