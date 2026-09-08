import { queryOptions } from '@tanstack/react-query';

import type { ScheduleDataSource } from '@/features/schedules/api/schedule.dataSource';
import { toSchedule, toScheduleMember } from '@/features/schedules/api/schedule.mappers';
import {
  monthlyScheduleSchema,
  scheduleMemberSchema,
  scheduleSchema,
} from '@/features/schedules/api/schedule.schema';

export const scheduleQueries = {
  all: () => ['schedules'] as const,
  context: (source: ScheduleDataSource) =>
    queryOptions({
      queryKey: [...scheduleQueries.all(), source.key, 'context'],
      queryFn: ({ signal }) => source.context(signal),
    }),
  month: (source: ScheduleDataSource, storeId: number, month: string) =>
    queryOptions({
      queryKey: [...scheduleQueries.all(), source.key, storeId, 'month', month],
      queryFn: async ({ signal }) =>
        monthlyScheduleSchema
          .parse(await source.month(storeId, month, signal))
          .schedules.map(toSchedule),
      enabled: storeId > 0,
    }),
  members: (source: ScheduleDataSource, storeId: number) =>
    queryOptions({
      queryKey: [...scheduleQueries.all(), source.key, storeId, 'members'],
      queryFn: async ({ signal }) =>
        scheduleMemberSchema
          .array()
          .parse(await source.members(storeId, signal))
          .map(toScheduleMember),
      enabled: storeId > 0,
    }),
  detail: (source: ScheduleDataSource, storeId: number, id: number) =>
    queryOptions({
      queryKey: [...scheduleQueries.all(), source.key, storeId, 'detail', id],
      queryFn: async ({ signal }) =>
        toSchedule(scheduleSchema.parse(await source.detail(storeId, id, signal))),
      enabled: storeId > 0 && id > 0,
    }),
};
