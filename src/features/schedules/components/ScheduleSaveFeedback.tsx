import type { ScheduleSaveResult } from '@/features/schedules/types';
import { ScheduleOverlay } from '@/features/schedules/components/ScheduleOverlay';
import { Button, Text } from '@/shared/ui';

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
      <ScheduleOverlay visible title="이미 등록된 근무가 있어요." onClose={onCancel} busy={busy}>
        <Text variant="bodySmall">
          중복 {duplicates.duplicateCount}건은 등록되지 않아요.{'\n'}나머지{' '}
          {duplicates.registerableCount}건만 등록할까요?
        </Text>
        <Button label="중복 제외하고 등록" onPress={onAcceptDuplicates} isLoading={busy} />
        <Button label="이전으로" variant="secondary" onPress={onCancel} disabled={busy} />
      </ScheduleOverlay>
    );
  if (!result) return null;
  const failed = result.failed.length;
  const retryable = result.failures.filter((failure) => failure.retryable).length;
  return (
    <ScheduleOverlay
      visible
      title={
        failed ? '등록하지 못한 근무가 있어요.' : editing ? '근무 수정 완료!' : '근무 등록 완료!'
      }
      onClose={failed ? onCancel : onFinish}
      busy={busy}
    >
      <Text variant="bodySmall" accessibilityLiveRegion="polite">
        {failed
          ? `${result.created.length}건을 등록했습니다. 등록하지 못한 ${failed}건 중 ${retryable}건을 다시 시도할 수 있습니다.`
          : editing
            ? '근무가 성공적으로 수정됐어요.'
            : `${result.created.length}건의 근무가 등록됐어요.`}
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
        label={failed ? '입력 내용으로 돌아가기' : '확인'}
        onPress={failed ? onCancel : onFinish}
        variant={failed ? 'secondary' : 'primary'}
        disabled={busy}
      />
    </ScheduleOverlay>
  );
}
