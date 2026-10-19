import { z } from 'zod';
import type { ScheduleItem } from '@/features/schedules/types';
import { isCalendarDate } from '@/shared/lib/date';
import { hasStarted, timeMinutes } from '@/shared/lib/time';
export const scheduleFormSchema = z
  .object({
    workDate: z.string().refine(isCalendarDate, '근무 날짜를 선택해주세요.'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '올바른 출근 시간을 입력해주세요.'),
    endTime: z
      .string()
      .regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/, '올바른 퇴근 시간을 입력해주세요.'),
  })
  .superRefine((value, context) => {
    if (timeMinutes(value.endTime) <= timeMinutes(value.startTime))
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: '종료 시간을 시작 시간 이후로 설정해주세요.',
      });
  });
export const canEditSchedule = (item: ScheduleItem, userId: number, now: Date): boolean =>
  item.member.id === userId && item.member.isActive && !hasStarted(item.date, item.startTime, now);
export const overlaps = (
  a: Pick<ScheduleItem, 'startTime' | 'endTime'>,
  b: Pick<ScheduleItem, 'startTime' | 'endTime'>,
) =>
  timeMinutes(a.startTime) < timeMinutes(b.endTime) &&
  timeMinutes(b.startTime) < timeMinutes(a.endTime);
