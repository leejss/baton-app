import { removeSchedule } from '@/features/schedules/api/schedule.api';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { invalidateScheduleViews } from '@/features/schedules/api/schedule.mutations';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';
import { ScheduleOverlay } from '@/features/schedules/components/ScheduleOverlay';
import { dateLabel } from '@/features/schedules/lib/scheduleDate';
import { canEditSchedule } from '@/features/schedules/lib/schedulePolicy';
import { isAppError } from '@/shared/api/errors';
import { Button, Text } from '@/shared/ui';

type ScheduleActionsProps = {
  id: number;
  now: Date;
  onClose: () => void;
};

export function ScheduleActions({ id, now, onClose }: ScheduleActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const context = useMainContext();
  const query = useQuery({
    ...scheduleQueries.detail(context.storeId ?? 0, id),
    enabled: Boolean(context) && !deleted,
  });
  const router = useRouter();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationKey: ['schedules', 'delete'],
    mutationFn: () => removeSchedule(context.storeId ?? 0, id),
    onError: async (error) => {
      if (isAppError(error) && [403, 404, 409].includes(error.status ?? 0)) {
        setConfirming(false);
        await invalidateScheduleViews(client, context.storeId);
      }
    },
    onSuccess: async () => {
      setDeleted(true);
      client.removeQueries({
        queryKey: scheduleQueries.detail(context.storeId, id).queryKey,
        exact: true,
      });
      await invalidateScheduleViews(client, context.storeId);
    },
  });
  const item = query.data;
  const canEdit = item && canEditSchedule(item, context.canManage ?? false, now);
  const missing =
    (isAppError(query.error) && query.error.status === 404) ||
    (isAppError(mutation.error) && mutation.error.status === 404);
  const handleClose = () => {
    if (!mutation.isPending) {
      void invalidateScheduleViews(client, context.storeId);
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
      ) : query.isError ? (
        <ScheduleMessage
          message="근무 일정을 불러오지 못했습니다."
          onRetry={() => void query.refetch()}
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
                onPress={() => {
                  if (!mutation.isPending) mutation.mutate();
                }}
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
