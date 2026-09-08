import { z } from 'zod';

const idSchema = z.number().int().positive();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const endTimeSchema = z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/);

const responseMetaSchema = z.object({
  result: z.enum(['SUCCESS', 'FAIL']),
  errorCode: z.string().nullable(),
  message: z.string().nullable(),
});

export const profileImageSchema = z.object({
  source: z.literal('STATIC'),
  key: z.enum(['DEFAULT_01', 'DEFAULT_MANAGER', 'DEFAULT_EMPLOYEE']),
});

export const userProfileSchema = z.object({
  id: idSchema,
  email: z.string().email(),
  displayName: z.string().min(2).max(20),
  profileImage: profileImageSchema,
  status: z.literal('ACTIVE').nullish(),
});

export const storeSchema = z.object({
  id: idSchema,
  storeName: z.string().min(2).max(50),
  branchName: z.string().min(1),
  address: z.string().min(1),
  detailAddress: z.string().nullish(),
  storeContact: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  createdAt: z.string().datetime(),
  deactivatedAt: z.string().datetime().nullish(),
});

export const membershipContextSchema = z.object({
  store: storeSchema,
  role: z.enum(['MANAGER', 'EMPLOYEE']),
  status: z.enum(['ACTIVE', 'LEFT']),
});

export const memberSchema = z.object({
  userId: idSchema,
  email: z.string().email(),
  displayName: z.string(),
  profileImage: profileImageSchema,
  role: z.enum(['MANAGER', 'EMPLOYEE']),
  status: z.enum(['ACTIVE', 'LEFT']),
});

const scheduleSchema = z.object({
  id: idSchema,
  employee: memberSchema,
  workDate: dateSchema,
  startTime: timeSchema,
  endTime: endTimeSchema,
  status: z.literal('ACTIVE'),
});

const handoverRecipientSchema = z.object({
  user: memberSchema,
  status: z.enum(['ACTIVE', 'PARTICIPATION_ENDED']),
  confirmedAt: z.string().datetime().nullish(),
  participationEndedAt: z.string().datetime().nullish(),
});

export const handoverListItemSchema = z.object({
  id: idSchema,
  type: z.enum(['WORK_TASK', 'STORE_STATUS', 'OTHER']),
  title: z.string().max(20),
  sender: memberSchema,
  recipient: handoverRecipientSchema,
  status: z.enum(['UNCONFIRMED', 'CONFIRMED', 'TERMINATED']),
  sentAt: z.string().datetime(),
});

const handoverSchema = handoverListItemSchema.extend({
  body: z.string().max(200),
  attachments: z.array(z.unknown()).max(10),
});

const notificationSchema = z.object({
  id: idSchema,
  type: z.enum([
    'HANDOVER_RECEIVED',
    'HANDOVER_CONFIRMED',
    'SCHEDULE_CHANGED',
    'UPDATE_ANNOUNCEMENT',
  ]),
  title: z.string().max(100),
  body: z.string().max(500).nullish(),
  handoverId: idSchema.nullish(),
  scheduleId: idSchema.nullish(),
  status: z.enum(['UNREAD', 'READ']),
  createdAt: z.string().datetime(),
  readAt: z.string().datetime().nullish(),
  expiresAt: z.string().datetime().nullish(),
});

export const userProfileResponseSchema = z.object({
  meta: responseMetaSchema,
  data: userProfileSchema,
});

/** 소속이 없으면 서버가 `null`을 준다. `.optional()`만으로는 거부되므로 `.nullish()`. */
export const myStoreResponseSchema = z.object({
  meta: responseMetaSchema,
  data: z.object({ membership: membershipContextSchema.nullish() }),
});

export const homeSummaryResponseSchema = z.object({
  meta: responseMetaSchema,
  data: z.object({
    date: dateSchema,
    schedulePreview: z.array(scheduleSchema).max(3),
    receivedHandoverCount: z.number().int().nonnegative(),
    receivedHandovers: z.array(handoverListItemSchema).max(3),
  }),
});

export const notificationListResponseSchema = z.object({
  meta: responseMetaSchema,
  data: z.object({
    items: z.array(notificationSchema),
    unreadCount: z.number().int().nonnegative(),
    badgeText: z.string(),
  }),
});

export const handoverResponseSchema = z.object({
  meta: responseMetaSchema,
  data: handoverSchema,
});

export type UserProfileDto = z.infer<typeof userProfileSchema>;
export type MembershipContextDto = z.infer<typeof membershipContextSchema>;
export type MemberDto = z.infer<typeof memberSchema>;
export type ScheduleDto = z.infer<typeof scheduleSchema>;
export type HandoverListItemDto = z.infer<typeof handoverListItemSchema>;
export type UserProfileResponseDto = z.infer<typeof userProfileResponseSchema>;
export type MyStoreResponseDto = z.infer<typeof myStoreResponseSchema>;
export type HomeSummaryResponseDto = z.infer<typeof homeSummaryResponseSchema>;
export type NotificationListResponseDto = z.infer<typeof notificationListResponseSchema>;
export type HandoverResponseDto = z.infer<typeof handoverResponseSchema>;
