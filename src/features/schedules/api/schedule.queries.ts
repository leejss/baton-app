import type { MemberDto } from '@/features/stores/api/store.schema';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import {
  fetchDailySchedules,
  fetchMonth,
  fetchSchedule,
} from '@/features/schedules/api/schedule.api';
import { toSchedule, toScheduleMember } from '@/features/schedules/api/mappers';
import { storeQueries } from '@/features/stores/api/store.queries';
export const scheduleQueries = {
  all: () => ['schedules'] as const,
  store: (storeId: number) => ['schedules', storeId] as const,
  month: (storeId: number, month: string) =>
    queryOptions({
      queryKey: [...scheduleQueries.store(storeId), 'month', month],
      queryFn: async ({ signal }) => (await fetchMonth(storeId, month, signal)).dailyScheduleCounts,
      enabled: storeId > 0,
    }),
  daily: (storeId: number, date: string) =>
    infiniteQueryOptions({
      queryKey: [...scheduleQueries.store(storeId), 'daily', date],
      initialPageParam: undefined as string | undefined,
      queryFn: async ({ pageParam, signal }) => {
        const page = await fetchDailySchedules(storeId, date, pageParam, signal);
        return { ...page, items: page.items.map(toSchedule) };
      },
      getNextPageParam: (lastPage) =>
        lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
      enabled: storeId > 0,
    }),
  members: (storeId: number) => ({
    ...storeQueries.members(storeId),
    select: (members: MemberDto[]) =>
      members.filter((member) => member.status === 'ACTIVE').map(toScheduleMember),
  }),
  detail: (storeId: number, id: number) =>
    queryOptions({
      queryKey: [...scheduleQueries.store(storeId), 'detail', id],
      queryFn: async ({ signal }) => toSchedule(await fetchSchedule(storeId, id, signal)),
      enabled: storeId > 0 && id > 0,
    }),
};
