import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import type { ScheduleDataSource } from '@/features/schedules/api/schedule.dataSource';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { ScheduleEditorForm } from '@/features/schedules/components/ScheduleEditorForm';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';
import { canEditSchedule } from '@/features/schedules/model/schedulePolicy';
import { isAppError } from '@/shared/api/errors';
import { Button } from '@/shared/ui';

type ScheduleEditorLoaderProps = {
  source: ScheduleDataSource;
  id?: number;
  initialDate?: string;
};

export function ScheduleEditorLoader({ source, id, initialDate }: ScheduleEditorLoaderProps) {
  const context = useQuery(scheduleQueries.context(source));
  const detail = useQuery(scheduleQueries.detail(source, context.data?.storeId ?? 0, id ?? 0));
  const router = useRouter();
  if (context.isError && !context.data)
    return (
      <ScheduleMessage
        message="매장 정보를 불러오지 못했습니다."
        onRetry={() => void context.refetch()}
      />
    );
  if (!context.data) return <ScheduleMessage message="매장 정보를 불러오는 중입니다." />;
  if (!context.data.canManage)
    return <ScheduleMessage message="관리자만 근무 일정을 변경할 수 있습니다." />;
  if (id !== undefined) {
    if (
      id <= 0 ||
      (!detail.data && isAppError(detail.error) && detail.error.errorCode === 'NOT_FOUND')
    )
      return (
        <>
          <ScheduleMessage message="삭제되었거나 수정할 수 없는 근무 일정입니다." />
          <Button label="근무표로 돌아가기" onPress={() => router.dismissTo('/schedules')} />
        </>
      );
    if (detail.isError && !detail.data)
      return (
        <ScheduleMessage
          message="근무 일정을 불러오지 못했습니다."
          onRetry={() => void detail.refetch()}
        />
      );
    if (!detail.data) return <ScheduleMessage message="수정할 근무를 불러오는 중입니다." />;
    if (!canEditSchedule(detail.data, true, new Date()))
      return <ScheduleMessage message="이미 시작된 근무는 수정할 수 없습니다." />;
  }
  return (
    <ScheduleEditorForm
      source={source}
      context={context.data}
      item={id === undefined ? undefined : detail.data}
      initialDate={initialDate}
    />
  );
}
