import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';

import type { ScheduleDataSource } from '@/features/schedules/api/schedule.dataSource';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { ScheduleCalendar } from '@/features/schedules/components/ScheduleCalendar';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';

type MonthlyCalendarProps = Omit<ComponentProps<typeof ScheduleCalendar>, 'counts'> & {
  source: ScheduleDataSource;
};

export function MonthlyCalendar({ source, ...props }: MonthlyCalendarProps) {
  const context = useQuery(scheduleQueries.context(source));
  const query = useQuery(scheduleQueries.month(source, context.data?.storeId ?? 0, props.month));
  const counts: Record<string, number> = {};
  for (const item of query.data ?? []) counts[item.date] = (counts[item.date] ?? 0) + 1;
  const hasError = context.isError || query.isError;
  const retry = () => {
    void (context.isError ? context.refetch() : query.refetch());
  };
  return (
    <>
      <ScheduleCalendar {...props} counts={counts} />
      {hasError && (
        <ScheduleMessage
          message="근무표를 불러오지 못했습니다."
          onRetry={retry}
          isLoading={query.isFetching || context.isFetching}
        />
      )}
      {!hasError && (context.isPending || query.isPending) && (
        <ScheduleMessage message="날짜별 근무 정보를 불러오는 중입니다." />
      )}
    </>
  );
}
