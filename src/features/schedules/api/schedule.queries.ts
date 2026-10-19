import { AppError } from '@/shared/api/errors';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import {
  fetchDailySchedules,
  fetchMonth,
  fetchSchedule,
} from '@/features/schedules/api/schedule.api';
import { toSchedule } from '@/features/schedules/api/mappers';
export const scheduleQueries = {
  all: () => ['schedules'] as const,
  store: (workspaceId: number) => ['schedules', workspaceId] as const,
  month: (workspaceId: number, month: string) =>
    queryOptions({
      queryKey: [...scheduleQueries.store(workspaceId), 'month', month],
      queryFn: async ({ signal }) =>
        (await fetchMonth(workspaceId, month, signal)).dailyScheduleCounts,
      enabled: workspaceId > 0,
    }),
  daily: (workspaceId: number, date: string) =>
    infiniteQueryOptions({
      queryKey: [...scheduleQueries.store(workspaceId), 'daily', date],
      initialPageParam: undefined as string | undefined,
      queryFn: async ({ pageParam, signal }) => {
        const page = await fetchDailySchedules(workspaceId, date, pageParam, signal);
        if (page.items.some((item) => item.workspaceId !== workspaceId))
          throw new AppError('server', '다른 워크스페이스의 근무예요.', {
            status: 403,
            errorCode: 'FORBIDDEN',
          });
        return { ...page, items: page.items.map(toSchedule) };
      },
      getNextPageParam: (lastPage) =>
        lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
      enabled: workspaceId > 0,
    }),
  detail: (workspaceId: number, id: number) =>
    queryOptions({
      queryKey: [...scheduleQueries.store(workspaceId), 'detail', id],
      queryFn: async ({ signal }) => {
        const dto = await fetchSchedule(workspaceId, id, signal);
        if (dto.workspaceId !== workspaceId)
          throw new AppError('server', '다른 워크스페이스의 근무예요.', {
            status: 403,
            errorCode: 'FORBIDDEN',
          });
        return toSchedule(dto);
      },
      enabled: workspaceId > 0 && id > 0,
    }),
};
