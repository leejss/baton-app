import { logger } from '@/shared/lib/logger';
import { removeSchedule } from '@/features/schedules/api/schedule.api';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ROUTES } from '@/shared/lib/routes';
import { invalidateScheduleViews } from '@/features/schedules/api/schedule.mutations';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';
import { ScheduleOverlay } from '@/features/schedules/components/ScheduleOverlay';
import { canEditSchedule } from '@/features/schedules/lib/schedulePolicy';
import { isAppError } from '@/shared/api/errors';
import { formatKoreanDate } from '@/shared/lib/formatters';
import { Button, Modal, MODAL_ICON_SIZE, Text } from '@/shared/ui';
import { CalendarSearch, Clock, EditFill, Trash } from '@/shared/ui/icons';
import { spacing } from '@/theme';

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
      logger.error('근무 삭제 실패', error);
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
  if (deleted)
    return (
      <Modal
        isVisible
        icon={<Trash size={MODAL_ICON_SIZE} color="foregroundDefault" />}
        title="삭제 완료"
        description="근무가 성공적으로 삭제됐어요."
        confirmLabel="확인"
        onConfirm={handleClose}
        onClose={mutation.isPending ? undefined : handleClose}
        confirmDisabled={mutation.isPending}
      />
    );
  const details = item && (
    <View style={styles.details}>
      {[
        { label: '근무일', value: formatKoreanDate(item.date), Icon: CalendarSearch },
        { label: '근무시간', value: `${item.startTime} - ${item.endTime}`, Icon: Clock },
      ].map(({ label, value, Icon }) => (
        <View key={label} style={styles.detailRow}>
          <View style={styles.detailLabel}>
            <Icon size={14} color="foregroundSubtle" />
            <Text variant="bodySmall" weight="semibold" color="foregroundSubtle">
              {label}
            </Text>
          </View>
          <Text variant="bodySmall" color="foregroundDefault" style={styles.detailValue}>
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
  return (
    <ScheduleOverlay
      visible
      variant="details"
      title={confirming ? '근무를 삭제할까요?' : (item?.member.name ?? '근무 일정')}
      description={!missing && !query.isError ? details : undefined}
      onClose={handleClose}
      busy={mutation.isPending}
    >
      {missing ? (
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
        <View style={styles.actions}>
          {mutation.isError && (
            <Text
              accessibilityLiveRegion="polite"
              color="foregroundWarningDefault"
              variant="bodySmall"
            >
              {mutation.error.message}
            </Text>
          )}
          {!canEdit && (
            <Text variant="bodySmall" color="foregroundDefault">
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
                leftIcon={
                  <EditFill
                    size={26}
                    color={canEdit ? 'foregroundInverse' : 'foregroundDisabled'}
                  />
                }
                disabled={!canEdit}
                onPress={() => {
                  onClose();
                  router.push(ROUTES.schedules.edit(String(id)));
                }}
              />
              <Button
                label="삭제"
                tone="weak"
                leftIcon={<Trash size={26} color="foregroundSubtle" />}
                disabled={!canEdit}
                onPress={() => setConfirming(true)}
              />
            </>
          )}
        </View>
      )}
    </ScheduleOverlay>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  details: { gap: spacing.xs },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  // Figma 1097:43247: 14px 아이콘 + 4px 간격 + 근무시간 라벨(49px).
  detailLabel: { width: 67, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  detailValue: { flex: 1 },
});
