import { StyleSheet, View } from 'react-native';

import { ScheduleOverlay } from '@/features/schedules/components/ScheduleOverlay';
import type { ScheduleSaveResult } from '@/features/schedules/types';
import { Button, Modal, Text } from '@/shared/ui';
import { AlertTriangleFill, CheckSquare } from '@/shared/ui/icons';
import { spacing } from '@/theme';

type ScheduleSaveFeedbackProps = {
  result?: ScheduleSaveResult;
  editing: boolean;
  busy: boolean;
  duplicates?: { duplicateCount: number; registerableCount: number };
  onRetry: () => void;
  onAcceptDuplicates: () => void;
  onCancel: () => void;
  onFinish: () => void;
};

export function ScheduleSaveFeedback({
  result,
  editing,
  busy,
  duplicates,
  onRetry,
  onAcceptDuplicates,
  onCancel,
  onFinish,
}: ScheduleSaveFeedbackProps) {
  if (duplicates)
    return (
      <ScheduleOverlay
        visible
        variant="warning"
        title="이미 등록된 근무가 있어요."
        onClose={onCancel}
        busy={busy}
        icon={<AlertTriangleFill size={40} color="foregroundWarningDefault" />}
        description={`중복 ${duplicates.duplicateCount}건은 등록되지 않아요.\n나머지 ${duplicates.registerableCount}건만 등록할까요?`}
      >
        <View style={styles.actions}>
          <Button label="중복 제외하고 등록" onPress={onAcceptDuplicates} isLoading={busy} />
          <Button label="이전으로" tone="weak" onPress={onCancel} disabled={busy} />
        </View>
      </ScheduleOverlay>
    );
  if (!result) return null;
  const failed = result.failed.length;
  if (!failed)
    return (
      <Modal
        isVisible
        icon={<CheckSquare size={50} color="surfaceSuccessDefault" />}
        title={editing ? '근무 수정 완료!' : '근무 등록 완료!'}
        description={editing ? '근무가 성공적으로 수정됐어요.' : '근무가 성공적으로 등록됐어요.'}
        confirmLabel="확인"
        onConfirm={onFinish}
        onClose={editing && !busy ? onFinish : undefined}
        confirmDisabled={busy}
      />
    );
  const retryable = result.failures.filter((failure) => failure.retryable).length;
  return (
    <ScheduleOverlay visible title="등록하지 못한 근무가 있어요." onClose={onCancel} busy={busy}>
      <Text variant="bodySmall" accessibilityLiveRegion="polite">
        {`${result.created.length}건을 등록했습니다. 등록하지 못한 ${failed}건 중 ${retryable}건을 다시 시도할 수 있습니다.`}
        {result.duplicates.length > 0 ? `\n중복 ${result.duplicates.length}건은 제외했습니다.` : ''}
      </Text>
      {retryable > 0 && <Button label="실패한 날짜만 재시도" onPress={onRetry} isLoading={busy} />}
      {failed > retryable && (
        <Text variant="bodySmall">
          시작 시각 경과 등 입력 변경이 필요한 날짜는 새 근무로 등록해주세요. 성공한 일정은
          유지됩니다.
        </Text>
      )}
      <Button
        label="입력 내용으로 돌아가기"
        onPress={onCancel}
        variant="secondary"
        disabled={busy}
      />
    </ScheduleOverlay>
  );
}

const styles = StyleSheet.create({ actions: { gap: spacing.sm } });
