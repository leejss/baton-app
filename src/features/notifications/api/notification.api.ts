import { get, post } from '@/shared/api/client';
import { parseApiId } from '@/shared/api/ids';
import {
  notificationSchema,
  notificationListSchema,
} from '@/features/notifications/api/notification.schema';
export const fetchNotifications = (storeId: number, signal?: AbortSignal) =>
  get(`/stores/${storeId}/notifications`, notificationListSchema, { signal });
export const markNotificationRead = (id: string) =>
  post(`/notifications/${parseApiId(id)}/read`, undefined, notificationSchema);
