import { z } from 'zod';

export const handoffTypeSchema = z.enum(['WORK_TASK', 'STORE_STATUS', 'OTHER']);
export const handoffStatusSchema = z.enum(['UNCONFIRMED', 'CONFIRMED', 'TERMINATED']);
export const handoffScopeSchema = z.enum(['ALL', 'RECEIVED', 'SENT']);

const profileImageSchema = z.object({
  source: z.literal('STATIC'),
  key: z.enum(['DEFAULT_01', 'DEFAULT_MANAGER', 'DEFAULT_EMPLOYEE']),
});

export const memberSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  profileImage: profileImageSchema,
  role: z.enum(['MANAGER', 'EMPLOYEE']),
  status: z.enum(['ACTIVE', 'LEFT']),
});

const handoffRecipientSchema = z.object({
  user: memberSchema,
  status: z.enum(['ACTIVE', 'PARTICIPATION_ENDED']),
  confirmedAt: z.string().datetime().nullish(),
  participationEndedAt: z.string().datetime().nullish(),
});

export const attachmentSchema = z.object({
  id: z.string().min(1),
  purpose: z.literal('HANDOVER'),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024),
  status: z.enum(['PENDING', 'VERIFIED', 'LINKED', 'DELETED']),
  downloadUrl: z.string().url().nullish(),
  downloadUrlExpiresAt: z.string().datetime().nullish(),
});

export const handoffListItemSchema = z.object({
  id: z.string().min(1),
  type: handoffTypeSchema,
  title: z.string().max(20),
  sender: memberSchema,
  recipient: handoffRecipientSchema,
  status: handoffStatusSchema,
  sentAt: z.string().datetime(),
});

export const handoffPageSchema = z.object({
  items: z.array(handoffListItemSchema),
  nextCursor: z.string().nullish(),
  hasNext: z.boolean(),
});

export const handoffSchema = handoffListItemSchema.extend({
  body: z.string().max(200),
  attachments: z.array(attachmentSchema).max(10),
});

export const handoffCreateRequestSchema = z.object({
  type: handoffTypeSchema,
  title: z.string().trim().min(1).max(20),
  body: z.string().trim().min(1).max(200),
  recipientId: z.string().min(1),
  attachmentIds: z.array(z.string().min(1)).max(10).optional(),
});

export const handoffUpdateRequestSchema = handoffCreateRequestSchema.omit({ type: true });

export const recipientRecommendationSchema = z.object({
  recommended: memberSchema.nullish(),
  recommendedStartAt: z.string().datetime().nullish(),
  candidates: z.array(memberSchema),
});

export type HandoffTypeDto = z.infer<typeof handoffTypeSchema>;
export type HandoffStatusDto = z.infer<typeof handoffStatusSchema>;
export type HandoffScopeDto = z.infer<typeof handoffScopeSchema>;
export type MemberDto = z.infer<typeof memberSchema>;
export type AttachmentDto = z.infer<typeof attachmentSchema>;
export type HandoffListItemDto = z.infer<typeof handoffListItemSchema>;
export type HandoffPageDto = z.infer<typeof handoffPageSchema>;
export type HandoffDto = z.infer<typeof handoffSchema>;
export type HandoffCreateRequestDto = z.infer<typeof handoffCreateRequestSchema>;
export type HandoffUpdateRequestDto = z.infer<typeof handoffUpdateRequestSchema>;
export type RecipientRecommendationDto = z.infer<typeof recipientRecommendationSchema>;
