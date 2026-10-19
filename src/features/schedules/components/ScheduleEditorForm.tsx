import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { CalendarMonthHeader } from '@/features/schedules/components/CalendarMonthHeader';
import { MonthlyCalendar } from '@/features/schedules/components/MonthlyCalendar';
import { ScheduleOverlay } from '@/features/schedules/components/ScheduleOverlay';
import { ScheduleTimeFields } from '@/features/schedules/components/ScheduleTimeFields';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';
import { useScheduleEditor } from '@/features/schedules/hooks/useScheduleEditor';
import { monthLimits, shiftMonth } from '@/features/schedules/lib/scheduleDate';
import type { ScheduleContext, ScheduleItem } from '@/features/schedules/types';
import { getTodayInSeoul } from '@/shared/lib/date';
import { Button, BottomActionBar, Modal, Text } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing, useTheme } from '@/theme';
export function ScheduleEditorForm(props: {
  context: ScheduleContext;
  item?: ScheduleItem;
  initialDate?: string;
}) {
  const editor = useScheduleEditor(props);
  const { form, values, step, mutation } = editor;
  const { colors } = useTheme();
  const today = getTodayInSeoul();
  const [month, setMonth] = useState((props.item?.date ?? props.initialDate ?? today).slice(0, 7));
  const [outOfRange, setOutOfRange] = useState(false);
  const locked = mutation.isPending || editor.complete;
  useEffect(() => {
    if (step === 1) form.setFocus('startTime');
  }, [step, form]);
  const changeMonth = (value: string) => {
    const { min, max } = monthLimits(today);
    if (value < min || value > max) {
      setOutOfRange(true);
      return;
    }
    setOutOfRange(false);
    setMonth(value);
  };
  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView
        style={styles.root}
        contentContainerStyle={styles.scroll}
        bottomOffset={100}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.calendar, { backgroundColor: colors.backgroundDefault }]}>
          <CalendarMonthHeader
            month={month}
            today={today}
            onChange={changeMonth}
            trailing={<Text>내 근무</Text>}
          />
          <MonthlyCalendar
            month={month}
            today={today}
            minDate={today}
            selectedDate={values.workDate}
            mode={step === 0 && !locked ? 'single' : 'readonly'}
            onSelect={editor.setDate}
            onMoveMonth={(direction) => changeMonth(shiftMonth(month, direction))}
          />
        </View>
        {outOfRange && (
          <ScheduleMessage message="현재 월 기준 과거 12개월부터 미래 3개월까지 선택할 수 있어요." />
        )}
        <View style={styles.fields}>
          <Text>본인의 근무일정을 등록합니다.</Text>
          <Text>{values.workDate || '근무 날짜를 선택해주세요.'}</Text>
          <ScheduleTimeFields
            control={form.control}
            disabled={locked}
            readOnly={step !== 1}
            onChange={editor.clearFailedAttempt}
          />
          {(form.formState.errors.root || form.formState.errors.workDate) && (
            <Text color="foregroundWarningDefault">
              {form.formState.errors.root?.message ?? form.formState.errors.workDate?.message}
            </Text>
          )}
          {mutation.isError && (
            <Text accessibilityLiveRegion="polite" color="foregroundWarningDefault">
              {mutation.error.message}
            </Text>
          )}
        </View>
      </KeyboardAwareScrollView>
      <BottomActionBar>
        <View style={styles.actions}>
          <Button
            label="이전"
            tone="weak"
            disabled={step === 0 || locked}
            onPress={() => editor.setStep(step - 1)}
          />
          <View style={styles.primary}>
            <Button
              label={step < 2 ? '다음' : props.item ? '수정 완료' : '등록'}
              isLoading={mutation.isPending}
              disabled={
                locked || (step === 0 ? !values.workDate : !values.startTime || !values.endTime)
              }
              onPress={editor.handleNext}
            />
          </View>
        </View>
      </BottomActionBar>
      <Modal
        isVisible={editor.complete}
        title={props.item ? '근무 수정 완료!' : '근무 등록 완료!'}
        confirmLabel="확인"
        onConfirm={editor.handleFinish}
      />
      <ScheduleOverlay
        visible={Boolean(editor.leave)}
        title="작성 중인 내용이 있어요."
        description="지금 나가면 입력한 내용이 사라져요."
        onClose={() => editor.setLeave(undefined)}
      >
        <View style={styles.actions}>
          <Button label="돌아가기" tone="weak" onPress={() => editor.setLeave(undefined)} />
          <Button
            label="나가기"
            color="red"
            onPress={() => {
              const leave = editor.leave;
              editor.setLeave(undefined);
              leave?.();
            }}
          />
        </View>
      </ScheduleOverlay>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: spacing.lg },
  calendar: { paddingHorizontal: SCREEN_PADDING_X, paddingTop: 14, paddingBottom: spacing.lg },
  fields: { padding: SCREEN_PADDING_X, gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  primary: { flex: 1 },
});
