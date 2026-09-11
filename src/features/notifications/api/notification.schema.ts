import { z } from 'zod';

const idSchema = z.number().int().positive();

export const notificationSchema = z.object({
  id: idSchema,
  type: z.enum([
    'UPDATE_ANNOUNCEMENT',
    'HANDOVER_RECEIVED',
    'HANDOVER_CONFIRMED',
    'SCHEDULE_CHANGED',
  ]),
  title: z.string().max(100),
  body: z.string().max(500).nullish(),
  handoverId: idSchema.nullish(),
  scheduleId: z.number().int().positive().nullish(),
  status: z.enum(['UNREAD', 'READ']),
  createdAt: z.iso.datetime({ offset: true }),
  readAt: z.iso.datetime({ offset: true }).nullish(),
  expiresAt: z.iso.datetime({ offset: true }).nullish(),
});

export const notificationListSchema = z.object({
  items: z.array(notificationSchema),
  unreadCount: z.number().int().nonnegative(),
  badgeText: z.string(),
});

export type NotificationDto = z.infer<typeof notificationSchema>;
