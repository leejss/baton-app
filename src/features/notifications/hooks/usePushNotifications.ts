import { onlineManager, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuthStore } from '@/features/auth/store/authStore';
import { notificationQueries } from '@/features/notifications/api/notification.queries';
import { homeQueries } from '@/features/home/api/home.queries';
import { registerBackgroundNotifications } from '@/features/notifications/lib/backgroundNotifications';
import {
  canReceiveNotifications,
  requestNotificationPermission,
  subscribeNotificationPermissions,
} from '@/features/notifications/lib/notificationPermissions';
import {
  forgetPushRegistration,
  disablePushRegistration,
  resumePushRegistration,
  syncPushToken,
} from '@/features/notifications/lib/pushRegistration';
import {
  parsePushPayload,
  getNotificationPushPayload,
  presentPushNotification,
  PUSH_USER_KEY,
} from '@/features/notifications/lib/pushPresentation';
import { getDeviceId } from '@/shared/lib/deviceId';
import { logger } from '@/shared/lib/logger';
import { storage } from '@/shared/lib/mmkvStorage';
import { ROUTES } from '@/shared/lib/routes';

export function usePushNotifications() {
  const status = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (status === 'restoring' || Platform.OS === 'web') return;
    if (!userId) {
      storage.remove(PUSH_USER_KEY);
      void Notifications.dismissAllNotificationsAsync().catch((error) =>
        logger.error('알림 정리 실패', error),
      );
      return;
    }
    storage.set(PUSH_USER_KEY, userId);
    const currentUserId = userId;
    resumePushRegistration();
    const controller = new AbortController();
    const isCurrent = () =>
      !controller.signal.aborted && useAuthStore.getState().session?.user.id === userId;
    const report = (error: unknown) => {
      if (isCurrent()) logger.error('푸시 등록 실패', error);
    };
    let syncing = false;
    let permissionWasGranted = false;

    async function register(token: Notifications.DevicePushToken) {
      if (token.type !== 'ios' && token.type !== 'android') return;
      const deviceId = await getDeviceId();
      if (!isCurrent()) return;
      await syncPushToken(
        currentUserId,
        { token: token.data, deviceId, platform: token.type === 'ios' ? 'IOS' : 'ANDROID' },
        controller.signal,
      );
    }
    async function sync() {
      if (syncing || !isCurrent() || AppState.currentState !== 'active') return;
      syncing = true;
      try {
        await requestNotificationPermission(false, isCurrent);
        const permission = await Notifications.getPermissionsAsync();
        if (!isCurrent()) return;
        if (!canReceiveNotifications(permission)) {
          permissionWasGranted = false;
          await disablePushRegistration(controller.signal);
          return;
        }
        permissionWasGranted = true;
        await registerBackgroundNotifications().catch((error) =>
          logger.error('푸시 수신 작업 등록 실패', error),
        );
        await register(await Notifications.getDevicePushTokenAsync());
      } finally {
        syncing = false;
      }
    }
    const tokens = Notifications.addPushTokenListener((token) => {
      // 토큰 리스너 안에서 getDevicePushTokenAsync를 다시 부르면 재귀 호출된다.
      if (permissionWasGranted && isCurrent()) void register(token).catch(report);
    });
    const received = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      const payload = getNotificationPushPayload(notification);
      if (!isCurrent() || !payload) return;
      void queryClient.invalidateQueries({ queryKey: notificationQueries.all() });
      void queryClient.invalidateQueries({ queryKey: homeQueries.all() });
      if (!data?.localPush) void presentPushNotification(payload).catch(report);
    });
    let opened: string | undefined;
    function open(response: Notifications.NotificationResponse | null) {
      if (!isCurrent() || !response) return;
      const data = response.notification.request.content.data;
      if (data?.localPush !== true || data.userId !== userId || !parsePushPayload(data)) return;
      const id = response.notification.request.identifier;
      if (opened === id) return;
      opened = id;
      void Notifications.clearLastNotificationResponseAsync().catch(report);
      router.push(ROUTES.notifications);
    }
    const responses = Notifications.addNotificationResponseReceivedListener(open);
    void Notifications.getLastNotificationResponseAsync().then(open).catch(report);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync().catch(report);
    });
    const online = onlineManager.subscribe((connected) => {
      if (connected) void sync().catch(report);
    });
    const permissions = subscribeNotificationPermissions(() => {
      void sync().catch(report);
    });
    void sync().catch(report);
    return () => {
      controller.abort();
      forgetPushRegistration();
      tokens.remove();
      received.remove();
      responses.remove();
      foreground.remove();
      online();
      permissions();
    };
  }, [status, userId, queryClient, router]);
}
