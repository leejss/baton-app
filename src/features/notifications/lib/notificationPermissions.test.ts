import { beforeEach, expect, it, jest } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import { Alert, Linking } from 'react-native';
import { storage } from '@/shared/lib/mmkvStorage';
import { requestNotificationPermission } from '@/features/notifications/lib/notificationPermissions';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  IosAuthorizationStatus: { PROVISIONAL: 3 },
}));
jest.mock('@/shared/lib/mmkvStorage', () => {
  const values = new Map();
  return {
    storage: {
      getBoolean: (key: string) => values.get(key),
      set: (key: string, value: unknown) => values.set(key, value),
      clearAll: () => values.clear(),
    },
  };
});

const undecided: Notifications.NotificationPermissionsStatus = {
  granted: false,
  canAskAgain: true,
  expires: 'never',
  status: 'undetermined' as Notifications.PermissionStatus,
};
beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  storage.clearAll();
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(undecided);
  jest
    .mocked(Notifications.requestPermissionsAsync)
    .mockResolvedValue({ ...undecided, granted: true });
  jest.spyOn(Linking, 'openSettings').mockResolvedValue();
});

it('설명에 동의한 후에만 OS 알림 권한을 요청한다', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    buttons?.[1]?.onPress?.();
  });
  await requestNotificationPermission(false, () => true);
  expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
});

it('나중에를 선택하면 자동 재요청하지 않지만 마이페이지에서 다시 요청할 수 있다', async () => {
  const alert = jest
    .spyOn(Alert, 'alert')
    .mockImplementation((_title, _message, buttons) => buttons?.[0]?.onPress?.());
  await requestNotificationPermission(false, () => true);
  await requestNotificationPermission(false, () => true);
  expect(alert).toHaveBeenCalledTimes(1);
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  alert.mockImplementation((_title, _message, buttons) => buttons?.[1]?.onPress?.());
  await requestNotificationPermission(true, () => true);
  expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
});

it('영구 거부는 재요청 대신 설정 앱으로 안내한다', async () => {
  jest
    .mocked(Notifications.getPermissionsAsync)
    .mockResolvedValue({ ...undecided, canAskAgain: false });
  jest
    .spyOn(Alert, 'alert')
    .mockImplementation((_title, _message, buttons) => buttons?.[1]?.onPress?.());
  await requestNotificationPermission(true, () => true);
  expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
});

it('안내 중 로그아웃하면 OS 권한 창을 이어서 띄우지 않는다', async () => {
  let current = true;
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    current = false;
    buttons?.[1]?.onPress?.();
  });
  await requestNotificationPermission(false, () => current);
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
});
