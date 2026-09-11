import { z } from 'zod';

import { hasStarted, isCalendarDate, timeMinutes } from '@/features/schedules/lib/scheduleDate';
import type { ScheduleItem } from '@/features/schedules/types';

export const scheduleFormSchema = z
  .object({
    employeeId: z.number({ error: '직원을 선택해주세요.' }).int().positive(),
    startDate: z.string().refine(isCalendarDate, '근무 날짜를 선택해주세요.'),
    endDate: z.string().refine(isCalendarDate, '근무 날짜를 선택해주세요.'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '올바른 출근 시간을 입력해주세요.'),
    endTime: z
      .string()
      .regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/, '올바른 퇴근 시간을 입력해주세요.'),
  })
  .superRefine((value, context) => {
    if (value.endDate < value.startDate)
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: '종료 날짜를 시작 날짜 이후로 선택해주세요.',
      });
    if (timeMinutes(value.endTime) <= timeMinutes(value.startTime))
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: '종료 시간을 시작 시간 이후로 설정해주세요.',
      });
  });

export function sortSchedules(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id - b.id);
}

export function daySchedules(items: ScheduleItem[], date: string, userId: number) {
  const all = sortSchedules(items.filter((item) => item.date === date));
  // 사용자 결정: 본인 일정이 여러 개면 가장 늦게 끝나는 본인 근무를 기준으로 한다.
  const own = all
    .filter((item) => item.member.id === userId)
    .sort((a, b) => b.endTime.localeCompare(a.endTime) || a.id - b.id)[0];
  const preview = own
    ? [
        own,
        ...all
          .filter((item) => item.member.id !== userId && item.startTime >= own.endTime)
          .slice(0, 2),
      ]
    : all.slice(0, 3);
  return {
    all,
    preview,
    hasMore: preview.length < all.length,
    workerCount: new Set(all.map((item) => item.member.id)).size,
  };
}

export function canEditSchedule(item: ScheduleItem, canManage: boolean, now: Date): boolean {
  return canManage && !hasStarted(item.date, item.startTime, now);
}

export function overlaps(
  a: Pick<ScheduleItem, 'startTime' | 'endTime'>,
  b: Pick<ScheduleItem, 'startTime' | 'endTime'>,
): boolean {
  return (
    timeMinutes(a.startTime) < timeMinutes(b.endTime) &&
    timeMinutes(b.startTime) < timeMinutes(a.endTime)
  );
}
