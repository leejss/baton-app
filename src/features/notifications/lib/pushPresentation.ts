import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { z } from 'zod';
import { pushPayloadSchema, type PushPayload } from '@/features/notifications/api/push.schema';
import {
  NOTIFICATION_CHANNEL,
  canReceiveNotifications,
  prepareNotificationChannel,
} from '@/features/notifications/lib/notificationPermissions';
import { storage } from '@/shared/lib/mmkvStorage';

// 인증 토큰 없이도 잠금 화면에서 일반 안내 문구를 표시할 수 있도록 사용자 ID만 보관한다.
export const PUSH_USER_KEY = 'notifications.active-user';
const DISPLAYED_KEY = 'notifications.displayed';
const titles: Record<PushPayload['type'], string> = {
  UPDATE_ANNOUNCEMENT: '새로운 서비스 공지가 있어요',
  HANDOVER_RECEIVED: '새로운 인수인계가 도착했어요',
  HANDOVER_CONFIRMED: '인수인계가 확인되었어요',
};
let presentationQueue = Promise.resolve();

export function parsePushPayload(value: unknown): PushPayload | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    'dataString' in value &&
    typeof value.dataString === 'string'
  ) {
    try {
      value = JSON.parse(value.dataString);
    } catch {
      return null;
    }
  }
  const result = pushPayloadSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function getNotificationPushPayload(notification: Notifications.Notification) {
  const { content, trigger } = notification.request;
  const payload = parsePushPayload(content.data);
  if (payload || !trigger || !('type' in trigger) || trigger.type !== 'push') return payload;
  // APNs 직접 발송은 최상위 userInfo에 식별자가 들어간다. Expo의 content.data는
  // userInfo.body만 읽으므로 iOS 원본 trigger.payload도 확인해야 한다.
  return parsePushPayload(trigger.payload) ?? parsePushPayload(trigger.remoteMessage?.data);
}

/** 포그라운드 리스너와 백그라운드 작업이 같은 푸시를 전달해도 한 번만 표시한다. */
export function presentPushNotification(data: unknown) {
  const payload = parsePushPayload(data);
  if (!payload) return Promise.resolve();
  const userId = storage.getNumber(PUSH_USER_KEY);
  if (!userId) return Promise.resolve();
  const result = presentationQueue.then(async () => {
    const permission = await Notifications.getPermissionsAsync();
    if (!canReceiveNotifications(permission) || storage.getNumber(PUSH_USER_KEY) !== userId) return;
    let displayed: string[] = [];
    try {
      displayed = z.array(z.string()).parse(JSON.parse(storage.getString(DISPLAYED_KEY) ?? '[]'));
    } catch {
      /* 캐시가 손상되면 새로 만든다. */
    }
    const identifier = `baton:${userId}:${payload.notificationId}`;
    if (displayed.includes(identifier)) return;
    await prepareNotificationChannel();
    if (storage.getNumber(PUSH_USER_KEY) !== userId) return;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: titles[payload.type],
        body: '앱에서 내용을 확인해주세요.',
        sound: 'default',
        data: { ...payload, userId, localPush: true },
      },
      trigger: Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL } : null,
    });
    storage.set(DISPLAYED_KEY, JSON.stringify([...displayed, identifier].slice(-100)));
  });
  presentationQueue = result.catch(() => {});
  return result;
}
