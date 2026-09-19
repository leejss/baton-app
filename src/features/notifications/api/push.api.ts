import { del, post } from '@/shared/api/client';
import { pushTokenSchema, type PushTokenRequest } from '@/features/notifications/api/push.schema';

export const registerPushToken = (request: PushTokenRequest, signal?: AbortSignal) =>
  post('/push-tokens', request, pushTokenSchema, { signal });

export const disableCurrentPushToken = (signal?: AbortSignal) =>
  del('/push-tokens/current', { signal });
