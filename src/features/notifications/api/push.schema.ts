import { z } from 'zod';

export const pushPlatformSchema = z.enum(['IOS', 'ANDROID']);
export const pushTokenSchema = z.object({
  id: z.number().int().positive(),
  deviceId: z.string(),
  platform: pushPlatformSchema,
  status: z.enum(['ACTIVE', 'DISABLED']),
});

export const pushPayloadSchema = z.object({
  notificationId: z
    .union([z.string().regex(/^[1-9]\d*$/), z.number().int().positive()])
    .transform(String),
  type: z.enum([
    'UPDATE_ANNOUNCEMENT',
    'HANDOVER_RECEIVED',
    'HANDOVER_CONFIRMED',
    'SCHEDULE_CHANGED',
  ]),
});

export type PushPayload = z.infer<typeof pushPayloadSchema>;
export type PushTokenRequest = {
  token: string;
  deviceId: string;
  platform: z.infer<typeof pushPlatformSchema>;
};
