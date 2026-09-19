import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';
import { storage } from '@/shared/lib/mmkvStorage';

export const NOTIFICATION_CHANNEL = 'baton-notifications';
const PROMPT_KEY = 'notifications.permission-explained';
let permissionRequest: Promise<void> | undefined;
const permissionListeners = new Set<() => void>();

export function subscribeNotificationPermissions(listener: () => void) {
  permissionListeners.add(listener);
  return () => {
    permissionListeners.delete(listener);
  };
}

export function canReceiveNotifications(permission: Notifications.NotificationPermissionsStatus) {
  return (
    permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function prepareNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL, {
    name: '인수인계 및 근무 알림',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}

function explainPermission(isSettings: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      isSettings ? '알림이 꺼져 있어요' : '중요한 소식을 알림으로 받아보세요',
      isSettings
        ? '기기 설정에서 알림을 허용하면 인수인계와 근무 일정 변경을 알려드려요.'
        : '새로운 인수인계와 근무 일정 변경을 놓치지 않도록 알림을 보내드려요.',
      [
        { text: '나중에', style: 'cancel', onPress: () => resolve(false) },
        { text: isSettings ? '설정 열기' : '계속', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** 자동 안내는 설치당 한 번. 마이페이지에서는 나중에 선택했거나 거절한 사용자도 다시 설정한다. */
export function requestNotificationPermission(manual: boolean, isCurrent: () => boolean) {
  permissionRequest ??= (async () => {
    await prepareNotificationChannel();
    const permission = await Notifications.getPermissionsAsync();
    if (!isCurrent()) return;
    if (canReceiveNotifications(permission)) {
      if (manual) await Linking.openSettings();
      return;
    }
    if (!manual && storage.getBoolean(PROMPT_KEY)) return;
    storage.set(PROMPT_KEY, true);
    const openSettings = !permission.canAskAgain;
    if (!(await explainPermission(openSettings)) || !isCurrent()) return;
    if (openSettings) {
      await Linking.openSettings();
      return;
    }
    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
  })().finally(() => {
    permissionRequest = undefined;
    for (const listener of permissionListeners) listener();
  });
  return permissionRequest;
}
