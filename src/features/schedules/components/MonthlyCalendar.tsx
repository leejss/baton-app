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
  const query = useQuery(scheduleQueries.month(context.workspaceId, props.month));
  const counts: Record<string, number> = {};
  for (const item of query.data ?? []) counts[item.date] = item.scheduleCount;

  // 월간 조회 중에도 달력 조작 영역은 유지한다. 데이터가 도착하기 전에는
  // 근무 점만 비워서 날짜 선택과 월 이동을 막지 않는다.
  if (query.isPending && query.data === undefined)
    return <ScheduleCalendar {...props} counts={counts} />;

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
