import { memberSchema } from '@/features/stores/api/store.schema';
import { z } from 'zod';

import { isCalendarDate } from '@/shared/lib/date';

const id = z.number().int().positive();
const date = z.string().refine(isCalendarDate);
const startTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const endTime = z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/);
export const scheduleSchema = z.object({
  id,
  workspaceId: id,
  employee: memberSchema,
  workDate: date,
  startTime,
  endTime,
  status: z.literal('ACTIVE'),
});
export const monthlyScheduleSchema = z.object({
  monthStart: date,
  monthEnd: date,
  dailyScheduleCounts: z.array(z.object({ date, scheduleCount: z.number().int().nonnegative() })),
});
export const dailySchedulePageSchema = z.object({
  date,
  totalEmployeeCount: z.number().int().nonnegative(),
  items: z.array(scheduleSchema),
  nextCursor: z.string().nullish(),
  hasNext: z.boolean(),
});
export type ScheduleDto = z.infer<typeof scheduleSchema>;
export type ScheduleCreateRequest = { workDate: string; startTime: string; endTime: string };
export type ScheduleUpdateRequest = ScheduleCreateRequest;
