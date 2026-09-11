import { memberSchema } from '@/features/stores/api/store.schema';
import { z } from 'zod';

export const handoffTypeSchema = z.enum(['WORK_TASK', 'STORE_STATUS', 'OTHER']);
export const handoffStatusSchema = z.enum(['UNCONFIRMED', 'CONFIRMED', 'TERMINATED']);
export const handoffScopeSchema = z.enum(['ALL', 'RECEIVED', 'SENT']);

export { memberSchema } from '@/features/stores/api/store.schema';

const handoffRecipientSchema = z.object({
  user: memberSchema,
  status: z.enum(['ACTIVE', 'PARTICIPATION_ENDED']),
  confirmedAt: z.iso.datetime({ offset: true }).nullish(),
  participationEndedAt: z.iso.datetime({ offset: true }).nullish(),
});

export const attachmentSchema = z.object({
  id: z.number().int().positive(),
  purpose: z.literal('HANDOVER'),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024),
  status: z.enum(['PENDING', 'VERIFIED', 'LINKED', 'DELETED']),
  downloadUrl: z.string().url().nullish(),
  downloadUrlExpiresAt: z.iso.datetime({ offset: true }).nullish(),
});

export const handoffListItemSchema = z.object({
  id: z.number().int().positive(),
  type: handoffTypeSchema,
  title: z.string().max(20),
  sender: memberSchema,
  recipient: handoffRecipientSchema,
  status: handoffStatusSchema,
  sentAt: z.iso.datetime({ offset: true }),
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
  recipientId: z.number().int().positive(),
  attachmentIds: z.array(z.number().int().positive()).max(10).optional(),
});

export const handoffUpdateRequestSchema = handoffCreateRequestSchema.omit({
  type: true,
});

export const recipientRecommendationSchema = z.object({
  recommended: memberSchema.nullish(),
  recommendedStartAt: z.iso.datetime({ offset: true }).nullish(),
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
