import { z } from 'zod';

import { isCalendarDate } from '@/features/schedules/lib/scheduleDate';

const id = z.number().int().positive();
const date = z.string().refine(isCalendarDate);
const startTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const endTime = z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/);
export const scheduleMemberSchema = z.object({
  userId: id,
  displayName: z.string(),
  email: z.string().email(),
  profileImage: z.object({
    source: z.literal('STATIC'),
    key: z.enum(['DEFAULT_01', 'DEFAULT_MANAGER', 'DEFAULT_EMPLOYEE']),
  }),
  role: z.enum(['MANAGER', 'EMPLOYEE']),
  status: z.enum(['ACTIVE', 'LEFT']),
});
export const scheduleSchema = z.object({
  id,
  employee: scheduleMemberSchema,
  workDate: date,
  startTime,
  endTime,
  status: z.literal('ACTIVE'),
});
export const monthlyScheduleSchema = z.object({
  monthStart: date,
  monthEnd: date,
  schedules: z.array(scheduleSchema),
  selectedDatePreview: z
    .object({
      date,
      schedules: z.array(scheduleSchema).max(3),
      hasMore: z.boolean(),
    })
    .optional(),
});
export const scheduleBatchSchema = z.object({
  requestedCount: z.number().int().positive(),
  createdCount: z.number().int().nonnegative(),
  duplicateCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  results: z.array(
    z.object({
      workDate: date,
      status: z.enum(['CREATED', 'DUPLICATE', 'FAILED']),
      schedule: scheduleSchema.optional(),
      errorCode: z.string().optional(),
    }),
  ),
});
export const duplicateCountsSchema = z.object({
  requestedCount: z.number().int(),
  duplicateCount: z.number().int(),
  registerableCount: z.number().int(),
});
export type ScheduleDto = z.infer<typeof scheduleSchema>;
export type ScheduleMemberDto = z.infer<typeof scheduleMemberSchema>;
export type ScheduleBatchDto = z.infer<typeof scheduleBatchSchema>;
export type ScheduleCreateRequest = {
  employeeId: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  acceptNonDuplicates: boolean;
};
export type ScheduleUpdateRequest = {
  employeeId: number;
  workDate: string;
  startTime: string;
  endTime: string;
};
