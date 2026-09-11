import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';

import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { ScheduleCalendar } from '@/features/schedules/components/ScheduleCalendar';
import { QueryBoundary } from '@/shared/ui/QueryBoundary';
import { QueryRefreshNotice } from '@/shared/ui/QueryRefreshNotice';

type MonthlyCalendarProps = Omit<ComponentProps<typeof ScheduleCalendar>, 'counts'>;
export function MonthlyCalendar(props: MonthlyCalendarProps) {
  const context = useMainContext();
  const query = useQuery(scheduleQueries.month(context.storeId, props.month));
  const counts: Record<string, number> = {};
  for (const item of query.data ?? []) counts[item.date] = (counts[item.date] ?? 0) + 1;
  return (
    <QueryBoundary query={query}>
      <ScheduleCalendar {...props} counts={counts} />
      <QueryRefreshNotice
        failed={query.isError && query.data !== undefined}
        onRetry={() => void query.refetch()}
      />
    </QueryBoundary>
  );
}
