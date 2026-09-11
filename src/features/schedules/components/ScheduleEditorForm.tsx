import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
  useKeyboardState,
} from 'react-native-keyboard-controller';

import { CalendarMonthHeader } from '@/features/schedules/components/CalendarMonthHeader';
import { EmployeePicker } from '@/features/schedules/components/EmployeePicker';
import { MonthlyCalendar } from '@/features/schedules/components/MonthlyCalendar';
import { ScheduleOverlay } from '@/features/schedules/components/ScheduleOverlay';
import { ScheduleSaveFeedback } from '@/features/schedules/components/ScheduleSaveFeedback';
import { ScheduleTimeFields } from '@/features/schedules/components/ScheduleTimeFields';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';
import { useScheduleClock } from '@/features/schedules/hooks/useScheduleClock';
import { useScheduleEditor } from '@/features/schedules/hooks/useScheduleEditor';
import { monthLimits, shiftMonth } from '@/features/schedules/lib/scheduleDate';
import type { ScheduleContext, ScheduleItem } from '@/features/schedules/types';
import { rangeDates, getTodayInSeoul } from '@/shared/lib/date';
import { formatTimeRangeDuration } from '@/shared/lib/formatters';
import { Button, BottomActionBar, Text } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing, useTheme } from '@/theme';

type ScheduleEditorFormProps = {
  context: ScheduleContext;
  item?: ScheduleItem;
  initialDate?: string;
};

export function ScheduleEditorForm(props: ScheduleEditorFormProps) {
  const { context, item, initialDate } = props;
  const editor = useScheduleEditor(props);
  const { form, values, step, mutation, saveResult } = editor;
  const { colors } = useTheme();
  const now = useScheduleClock();
  const today = getTodayInSeoul(now);
  const [month, setMonth] = useState((item?.date ?? initialDate ?? today).slice(0, 7));
  const keyboardOpen = useKeyboardState((state) => state.isVisible);
  const [outOfRange, setOutOfRange] = useState(false);
  const start = values.startDate ?? '';
  const end = values.endDate ?? '';
  const dates = rangeDates(start, end);
  const locked = mutation.isPending || Boolean(saveResult?.created.length);
  const disabled =
    (saveResult !== undefined &&
      saveResult.failed.length > 0 &&
      !saveResult.failures.some((failure) => failure.retryable)) ||
    mutation.isPending ||
    (step === 0
      ? !values.employeeId
      : step === 1
        ? dates.length === 0
        : !values.startTime || !values.endTime);
  const handleMonthChange = (value: string) => {
    const { min, max } = monthLimits(today);
    if (value < min || value > max) {
      setOutOfRange(true);
      return;
    }
    setOutOfRange(false);
    setMonth(value);
  };
  const handleSelectDate = (date: string) => {
    if (locked) return;
    if (!item && start && start === end)
      editor.setRange(date < start ? date : start, date > start ? date : start);
    else editor.setRange(date, date);
  };
  const setEmployee = (id: number) => {
    form.setValue('employeeId', id, { shouldDirty: true });
    editor.clearFailedAttempt();
  };
  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        bottomOffset={120}
        contentContainerStyle={styles.scroll}
      >
        <View style={[styles.calendar, { backgroundColor: colors.background }]}>
          <CalendarMonthHeader month={month} today={today} onChange={handleMonthChange} />
          <MonthlyCalendar
            month={month}
            today={today}
            minDate={today}
            selectedDate={item ? start : undefined}
            range={!item && start ? { start, end } : undefined}
            mode={step === 1 && !locked ? (item ? 'single' : 'range') : 'readonly'}
            compact={step === 2 && keyboardOpen}
            onSelect={handleSelectDate}
            onRange={(range) => {
              if (!locked) editor.setRange(range.start, range.end);
            }}
            onMoveMonth={(direction) => handleMonthChange(shiftMonth(month, direction))}
          />
        </View>
        {outOfRange && (
          <ScheduleMessage message="현재 월 기준 과거 12개월부터 미래 3개월까지 조회할 수 있습니다." />
        )}
        <View style={styles.fields}>
          {step === 1 && (
            <Text variant="bodySmall" color="textSecondary">
              {item
                ? '변경할 근무 날짜 한 개를 선택해주세요.'
                : '날짜를 길게 누른 뒤 드래그하거나 시작일과 종료일을 눌러 선택해주세요.'}
              {dates.length ? `\n${start} ~ ${end} · ${dates.length}일 선택` : ''}
            </Text>
          )}
          {step >= 2 && (
            <ScheduleTimeFields
              control={form.control}
              disabled={locked}
              onChange={editor.clearFailedAttempt}
            />
          )}
          {(form.formState.errors.root ||
            form.formState.errors.employeeId ||
            form.formState.errors.startDate) && (
            <Text accessibilityLiveRegion="polite" variant="bodySmall" color="dangerText">
              {form.formState.errors.root?.message ??
                form.formState.errors.employeeId?.message ??
                form.formState.errors.startDate?.message}
            </Text>
          )}
          {mutation.isError && !editor.duplicates && (
            <Text accessibilityLiveRegion="polite" variant="bodySmall" color="dangerText">
              {mutation.error.message}
            </Text>
          )}
          {saveResult?.failed.length ? (
            <Text variant="bodySmall" color="dangerText">
              재시도할 날짜: {saveResult.failed.join(', ')}
            </Text>
          ) : null}
        </View>
      </KeyboardAwareScrollView>
      <KeyboardStickyView enabled={step === 2}>
        <BottomActionBar>
          <View style={styles.summary}>
            <EmployeePicker
              storeId={context.storeId}
              selectedId={values.employeeId ?? null}
              onSelect={setEmployee}
              initiallyOpen={step === 0}
              onDone={step === 0 ? editor.handleNext : undefined}
              disabled={locked}
            />
            {step === 3 && (
              <Text variant="bodySmall">
                근무{' '}
                <Text color="accent" weight="semibold">
                  {dates.length}일
                </Text>{' '}
                선택 · 하루{' '}
                <Text color="accent" weight="semibold">
                  {formatTimeRangeDuration(values.startTime ?? '', values.endTime ?? '')}
                </Text>{' '}
                근무
              </Text>
            )}
          </View>
          <View style={styles.actions}>
            <View style={styles.previous}>
              <Button
                label="이전"
                variant="secondary"
                disabled={step === 0 || locked}
                onPress={() => editor.setStep(step - 1)}
              />
            </View>
            <View style={styles.next}>
              <Button
                label={
                  step < 3
                    ? '다음'
                    : saveResult?.failed.length
                      ? '실패한 날짜만 재시도'
                      : item
                        ? '수정 완료'
                        : '등록'
                }
                variant={step === 3 ? 'accent' : 'primary'}
                isLoading={mutation.isPending}
                disabled={Boolean(disabled)}
                onPress={editor.handleNext}
              />
            </View>
          </View>
        </BottomActionBar>
      </KeyboardStickyView>
      <ScheduleSaveFeedback
        result={editor.showResult ? saveResult : undefined}
        editing={Boolean(item)}
        busy={mutation.isPending}
        duplicates={editor.duplicates}
        onRetry={() => editor.handleSave()}
        onAcceptDuplicates={() => editor.handleSave(true)}
        onCancel={() => {
          mutation.reset();
          editor.setShowResult(false);
        }}
        onFinish={editor.handleFinish}
      />
      <ScheduleOverlay
        visible={Boolean(editor.leave)}
        title="작성을 그만할까요?"
        onClose={() => editor.setLeave(undefined)}
      >
        <Text variant="bodySmall">
          {saveResult?.created.length
            ? '이미 등록된 근무는 유지됩니다. 등록하지 못한 날짜의 입력은 사라져요.'
            : '작성 중인 내용은 저장되지 않아요.'}
        </Text>
        <Button label="계속 작성" onPress={() => editor.setLeave(undefined)} />
        <Button
          label="나가기"
          variant="secondary"
          onPress={() => {
            const leave = editor.leave;
            editor.setLeave(undefined);
            leave?.();
          }}
        />
      </ScheduleOverlay>
    </View>
  );
}
const styles = StyleSheet.create({
  // TODO(design-system): Figma 등록 화면의 달력 위 여백 14px·하단 버튼 간격 10px를 sync한다.
  root: { flex: 1 },
  scroll: { paddingBottom: spacing.lg },
  calendar: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: 14,
    paddingBottom: spacing.lg,
  },
  fields: { padding: SCREEN_PADDING_X, gap: spacing.md },
  actions: { flexDirection: 'row', gap: 10 },
  previous: { flex: 1 },
  next: { flex: 3 },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.sm,
  },
});
