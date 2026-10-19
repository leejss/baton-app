import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { ScheduleEditorForm } from '@/features/schedules/components/ScheduleEditorForm';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';
import { canEditSchedule } from '@/features/schedules/lib/schedulePolicy';
import { isAppError } from '@/shared/api/errors';
import { Button } from '@/shared/ui';

type ScheduleEditorLoaderProps = {
  id?: number;
  initialDate?: string;
};

export function ScheduleEditorLoader({ id, initialDate }: ScheduleEditorLoaderProps) {
  const context = useMainContext();
  const detail = useQuery(scheduleQueries.detail(context.workspaceId ?? 0, id ?? 0));
  const router = useRouter();
  if (id !== undefined) {
    if (id <= 0 || (!detail.data && isAppError(detail.error) && detail.error.status === 404))
      return (
        <>
          <ScheduleMessage message="삭제되었거나 수정할 수 없는 근무 일정입니다." />
          <Button
            label="근무표로 돌아가기"
            onPress={() => router.dismissTo(ROUTES.schedules.index)}
          />
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
    if (!canEditSchedule(detail.data, context.userId, new Date()))
      return <ScheduleMessage message="본인의 시작 전 근무만 수정할 수 있어요." />;
  }
  return (
    <ScheduleEditorForm
      context={context}
      item={id === undefined ? undefined : detail.data}
      initialDate={initialDate}
    />
  );
}
