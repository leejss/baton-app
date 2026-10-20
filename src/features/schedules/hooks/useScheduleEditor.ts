import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useForm, useWatch } from 'react-hook-form';
import { Keyboard } from 'react-native';
import { createSchedule, updateSchedule } from '@/features/schedules/api/schedule.api';
import {
  invalidateScheduleViews,
  refreshScheduleConflict,
} from '@/features/schedules/api/schedule.mutations';
import { canEditSchedule, scheduleFormSchema } from '@/features/schedules/lib/schedulePolicy';
import type { ScheduleContext, ScheduleFormValues, ScheduleItem } from '@/features/schedules/types';
import { hasStarted } from '@/shared/lib/time';
import { ROUTES } from '@/shared/lib/routes';
import { logger } from '@/shared/lib/logger';
export function useScheduleEditor({
  context,
  initialDate,
  item,
}: {
  context: ScheduleContext;
  initialDate?: string;
  item?: ScheduleItem;
}) {
  const form = useForm<ScheduleFormValues>({
    defaultValues: {
      workDate: item?.date ?? initialDate ?? '',
      startTime: item?.startTime ?? '',
      endTime: item?.endTime ?? '',
    },
  });
  const values = useWatch({ control: form.control });
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [leave, setLeave] = useState<() => void>();
  const saving = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const client = useQueryClient();
  const router = useRouter();
  const navigation = useNavigation();
  const mutation = useMutation({
    mutationKey: ['schedules', context.workspaceId, item ? 'update' : 'create'],
    mutationFn: () => {
      const input = scheduleFormSchema.parse(form.getValues());
      return item
        ? updateSchedule(context.workspaceId, item.id, input)
        : createSchedule(context.workspaceId, input);
    },
    onError: (error) => {
      logger.error('근무 저장 실패', error);
      return refreshScheduleConflict(client, context.workspaceId, error);
    },
    onSuccess: async () => {
      if (mounted.current) setComplete(true);
      await invalidateScheduleViews(client, context.workspaceId);
    },
    onSettled: () => {
      saving.current = false;
    },
  });
  usePreventRemove(mutation.isPending || (!complete && form.formState.isDirty), ({ data }) => {
    if (!mutation.isPending) setLeave(() => () => navigation.dispatch(data.action));
  });
  const validate = () => {
    form.clearErrors();
    const parsed = scheduleFormSchema.safeParse(form.getValues());
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'workDate' || field === 'startTime' || field === 'endTime')
          form.setError(field, { message: issue.message });
      }
      return false;
    }
    if (
      (item && !canEditSchedule(item, context.userId, new Date())) ||
      hasStarted(parsed.data.workDate, parsed.data.startTime, new Date())
    ) {
      form.setError('root', { message: '본인의 시작 전 근무만 저장할 수 있어요.' });
      return false;
    }
    return true;
  };
  const handleSave = () => {
    if (saving.current || mutation.isPending || complete || !validate()) return;
    saving.current = true;
    Keyboard.dismiss();
    mutation.mutate();
  };
  const handleNext = () => {
    if (mutation.isPending || complete) return;
    if (step === 0) {
      if (!form.getValues('workDate')) return;
      setStep(1);
    } else if (step === 1) {
      if (validate()) {
        Keyboard.dismiss();
        setStep(2);
      }
    } else handleSave();
  };
  const clearFailedAttempt = () => {
    form.clearErrors();
    mutation.reset();
  };
  const setDate = (workDate: string) => {
    form.setValue('workDate', workDate, { shouldDirty: true });
    clearFailedAttempt();
  };
  return {
    form,
    values,
    step,
    setStep,
    mutation,
    complete,
    leave,
    setLeave,
    setDate,
    clearFailedAttempt,
    handleNext,
    handleFinish: () => router.dismissTo(ROUTES.schedules.list(form.getValues('workDate'))),
  };
}
