import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Keyboard } from 'react-native';

import type { ScheduleDataSource } from '@/features/schedules/api/schedule.dataSource';
import {
  getDuplicateCounts,
  invalidateScheduleViews,
  saveScheduleDates,
} from '@/features/schedules/api/schedule.mutations';
import { scheduleSchema } from '@/features/schedules/api/schedule.schema';
import { hasStarted, rangeDates } from '@/features/schedules/lib/scheduleDate';
import type {
  ScheduleContext,
  ScheduleFormValues,
  ScheduleItem,
  ScheduleSaveResult,
} from '@/features/schedules/model/schedule';
import { scheduleFormSchema } from '@/features/schedules/model/schedulePolicy';

type EditorOptions = {
  source: ScheduleDataSource;
  context: ScheduleContext;
  initialDate?: string;
  item?: ScheduleItem;
};
const isField = (field: PropertyKey | undefined): field is keyof ScheduleFormValues =>
  typeof field === 'string' &&
  ['employeeId', 'startDate', 'endDate', 'startTime', 'endTime'].includes(field);

export function useScheduleEditor({ source, context, initialDate, item }: EditorOptions) {
  const form = useForm<ScheduleFormValues>({
    defaultValues: {
      employeeId: item?.member.id ?? null,
      startDate: item?.date ?? initialDate ?? '',
      endDate: item?.date ?? initialDate ?? '',
      startTime: item?.startTime ?? '',
      endTime: item?.endTime ?? '',
    },
  });
  const values = useWatch({ control: form.control });
  const [step, setStep] = useState(item ? 1 : 0);
  const [saveResult, setSaveResult] = useState<ScheduleSaveResult>();
  const [showResult, setShowResult] = useState(false);
  const [leave, setLeave] = useState<() => void>();
  const client = useQueryClient();
  const router = useRouter();
  const navigation = useNavigation();
  const mutation = useMutation({
    mutationFn: async (acceptDuplicates: boolean) => {
      const input = scheduleFormSchema.parse(form.getValues());
      if (item) {
        scheduleSchema.parse(
          await source.update(context.storeId, item.id, {
            employeeId: input.employeeId,
            workDate: input.startDate,
            startTime: input.startTime,
            endTime: input.endTime,
          }),
        );
        return { created: [input.startDate], duplicates: [], failed: [] };
      }
      return saveScheduleDates(
        source,
        context.storeId,
        input,
        acceptDuplicates,
        saveResult?.failed.length ? saveResult.failed : undefined,
      );
    },
    onSuccess: async (result) => {
      setSaveResult((previous) => ({
        created: [...new Set([...(previous?.created ?? []), ...result.created])],
        duplicates: [...new Set([...(previous?.duplicates ?? []), ...result.duplicates])],
        failed: result.failed,
      }));
      setShowResult(true);
      await invalidateScheduleViews(client);
    },
  });
  const complete = saveResult !== undefined && saveResult.failed.length === 0;
  usePreventRemove(
    mutation.isPending || (!complete && (form.formState.isDirty || step > 0)),
    ({ data }) => {
      if (!mutation.isPending) setLeave(() => () => navigation.dispatch(data.action));
    },
  );
  const validate = () => {
    form.clearErrors();
    const input = form.getValues();
    const parsed = scheduleFormSchema.safeParse(input);
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        if (isField(issue.path[0])) form.setError(issue.path[0], { message: issue.message });
      return false;
    }
    const dates = saveResult?.failed.length
      ? saveResult.failed
      : rangeDates(input.startDate, input.endDate);
    if (dates.some((date) => hasStarted(date, input.startTime, new Date()))) {
      form.setError('root', {
        message: '이미 시작된 근무는 등록할 수 없습니다. 날짜와 시간을 변경해주세요.',
      });
      return false;
    }
    return true;
  };
  const handleNext = () => {
    if (step === 0 && !form.getValues('employeeId')) return;
    if (
      step === 1 &&
      rangeDates(form.getValues('startDate'), form.getValues('endDate')).length === 0
    )
      return;
    if (step >= 2 && !validate()) return;
    Keyboard.dismiss();
    if (step === 3) mutation.mutate(Boolean(saveResult?.failed.length));
    else setStep(step + 1);
  };
  const handleFinish = () =>
    router.dismissTo({
      pathname: '/schedules',
      params: { selectedDate: form.getValues('startDate') },
    });
  const clearFailedAttempt = () => {
    if (!saveResult?.created.length) setSaveResult(undefined);
    form.clearErrors();
    mutation.reset();
  };
  const setRange = (start: string, end: string) => {
    form.setValue('startDate', start, { shouldDirty: true });
    form.setValue('endDate', item ? start : end, { shouldDirty: true });
    clearFailedAttempt();
  };
  return {
    form,
    values,
    step,
    setStep,
    mutation,
    saveResult,
    showResult,
    setShowResult,
    complete,
    leave,
    setLeave,
    setRange,
    clearFailedAttempt,
    handleNext,
    handleFinish,
    duplicates: getDuplicateCounts(mutation.error),
  };
}
