import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import {
  presentPushNotification,
  PUSH_USER_KEY,
} from '@/features/notifications/lib/pushPresentation';
import { logger } from '@/shared/lib/logger';
import { storage } from '@/shared/lib/mmkvStorage';

const TASK_NAME = 'baton-background-notifications';

// 컴포넌트가 없는 headless 실행에서도 로드되도록 앱 entry에서 import한다.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    const show = data?.localPush === true && data.userId === storage.getNumber(PUSH_USER_KEY);
    return {
      shouldShowBanner: show,
      shouldShowList: show,
      shouldPlaySound: show,
      shouldSetBadge: false,
    };
  },
});

TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  TASK_NAME,
  async ({ data, error }) => {
    if (error) {
      logger.error('백그라운드 푸시 수신 실패', error);
      return Notifications.BackgroundNotificationTaskResult.Failed;
    }
    if (!data || 'actionIdentifier' in data || data.notification !== null) {
      return Notifications.BackgroundNotificationTaskResult.NoData;
    }
    try {
      await presentPushNotification(data.data);
      return Notifications.BackgroundNotificationTaskResult.NewData;
    } catch (failure) {
      logger.error('백그라운드 알림 표시 실패', failure);
      return Notifications.BackgroundNotificationTaskResult.Failed;
    }
  },
);

export async function registerBackgroundNotifications() {
  if (Platform.OS === 'web' || !(await TaskManager.isAvailableAsync())) return;
  if (!(await TaskManager.isTaskRegisteredAsync(TASK_NAME))) {
    await Notifications.registerTaskAsync(TASK_NAME);
  }
}

void registerBackgroundNotifications().catch((error) =>
  logger.error('푸시 수신 작업 등록 실패', error),
);
