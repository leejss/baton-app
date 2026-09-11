import { z } from 'zod';
import { scheduleSchema } from '@/features/schedules/api/schedule.schema';
import { handoffListItemSchema } from '@/features/handoffs/api/handoff.schema';
export const homeSummarySchema = z.object({
  date: z.iso.date(),
  schedulePreview: z.array(scheduleSchema).max(3),
  receivedHandoverCount: z.number().int().nonnegative(),
  receivedHandovers: z.array(handoffListItemSchema).max(3),
});
export type HomeSummary = z.infer<typeof homeSummarySchema>;
