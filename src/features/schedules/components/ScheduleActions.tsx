import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { ScheduleDataSource } from '@/features/schedules/api/schedule.dataSource';
import { invalidateScheduleViews } from '@/features/schedules/api/schedule.mutations';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';
import { ScheduleOverlay } from '@/features/schedules/components/ScheduleOverlay';
import { dateLabel } from '@/features/schedules/lib/scheduleDate';
import { canEditSchedule } from '@/features/schedules/model/schedulePolicy';
import { isAppError } from '@/shared/api/errors';
import { Button, Text } from '@/shared/ui';

type ScheduleActionsProps = {
  source: ScheduleDataSource;
  id: number;
  now: Date;
  onClose: () => void;
};

export function ScheduleActions({ source, id, now, onClose }: ScheduleActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const context = useQuery(scheduleQueries.context(source));
  const query = useQuery({
    ...scheduleQueries.detail(source, context.data?.storeId ?? 0, id),
    enabled: Boolean(context.data) && !deleted,
  });
  const router = useRouter();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => source.remove(context.data?.storeId ?? 0, id),
    onSuccess: async () => {
      setDeleted(true);
      await invalidateScheduleViews(client);
    },
  });
  const item = query.data;
  const canEdit = item && canEditSchedule(item, context.data?.canManage ?? false, now);
  const missing =
    (isAppError(query.error) && query.error.errorCode === 'NOT_FOUND') ||
    (isAppError(mutation.error) && mutation.error.errorCode === 'NOT_FOUND');
  const handleClose = () => {
    if (!mutation.isPending) {
      void invalidateScheduleViews(client);
      onClose();
    }
  };
  return (
    <ScheduleOverlay
      visible
      title={
        deleted
          ? '근무 삭제 완료!'
          : confirming
            ? '근무를 삭제할까요?'
            : (item?.member.name ?? '근무 일정')
      }
      onClose={handleClose}
      busy={mutation.isPending}
    >
      {deleted ? (
        <>
          <Text>근무가 성공적으로 삭제됐어요.</Text>
          <Button label="확인" onPress={handleClose} />
        </>
      ) : missing ? (
        <>
          <Text>이미 삭제되었거나 존재하지 않는 근무 일정입니다.</Text>
          <Button label="근무표로 돌아가기" onPress={handleClose} />
        </>
      ) : query.isError || context.isError ? (
        <ScheduleMessage
          message="근무 일정을 불러오지 못했습니다."
          onRetry={() => void (context.isError ? context.refetch() : query.refetch())}
        />
      ) : !item ? (
        <ScheduleMessage message="근무 일정을 불러오는 중입니다." />
      ) : (
        <>
          <Text variant="bodySmall" color="textSecondary">
            근무일　{dateLabel(item.date)}
            {'\n'}근무시간　{item.startTime} - {item.endTime}
          </Text>
          {mutation.isError && (
            <Text accessibilityLiveRegion="polite" color="dangerText" variant="bodySmall">
              {mutation.error.message}
            </Text>
          )}
          {!canEdit && (
            <Text variant="bodySmall" color="textSecondary">
              이미 시작된 근무이거나 편집 권한이 없습니다.
            </Text>
          )}
          {confirming ? (
            <>
              <Text variant="bodySmall">삭제한 근무는 되돌릴 수 없어요.</Text>
              <Button
                label="삭제 확인"
                disabled={!canEdit}
                isLoading={mutation.isPending}
                onPress={() => mutation.mutate()}
              />
              <Button
                label="취소"
                variant="secondary"
                disabled={mutation.isPending}
                onPress={() => setConfirming(false)}
              />
            </>
          ) : (
            <>
              <Button
                label="수정"
                disabled={!canEdit}
                onPress={() => {
                  onClose();
                  router.push({
                    pathname: '/schedules/[scheduleId]/edit',
                    params: { scheduleId: String(id) },
                  });
                }}
              />
              <Button
                label="삭제"
                variant="secondary"
                disabled={!canEdit}
                onPress={() => setConfirming(true)}
              />
            </>
          )}
        </>
      )}
    </ScheduleOverlay>
  );
}
