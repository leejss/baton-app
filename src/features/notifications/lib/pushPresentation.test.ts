import { beforeEach, expect, it, jest } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import { storage } from '@/shared/lib/mmkvStorage';
import {
  parsePushPayload,
  getNotificationPushPayload,
  presentPushNotification,
  PUSH_USER_KEY,
} from '@/features/notifications/lib/pushPresentation';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  AndroidImportance: { HIGH: 4 },
}));
jest.mock('@/shared/lib/mmkvStorage', () => {
  const values = new Map();
  return {
    storage: {
      getString: (key: string) => values.get(key),
      getNumber: (key: string) => values.get(key),
      set: (key: string, value: unknown) => values.set(key, value),
      remove: (key: string) => values.delete(key),
      clearAll: () => values.clear(),
    },
  };
});

const payload = { notificationId: '42', type: 'HANDOVER_RECEIVED' };
const granted: Notifications.NotificationPermissionsStatus = {
  granted: true,
  canAskAgain: true,
  expires: 'never',
  status: 'granted' as Notifications.PermissionStatus,
};

beforeEach(() => {
  jest.clearAllMocks();
  storage.clearAll();
  storage.set(PUSH_USER_KEY, 1);
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(granted);
  jest.mocked(Notifications.scheduleNotificationAsync).mockResolvedValue('local-42');
});

it('iOS 식별자 payload와 Android dataString을 읽되 잘못된 ID/유형은 무시한다', () => {
  expect(parsePushPayload(payload)).toEqual(payload);
  expect(parsePushPayload({ dataString: JSON.stringify(payload) })).toEqual(payload);
  expect(parsePushPayload({ dataString: '{invalid' })).toBeNull();
  expect(parsePushPayload({ ...payload, notificationId: '-1' })).toBeNull();
  expect(parsePushPayload({ ...payload, type: 'UNKNOWN' })).toBeNull();
});

it('iOS APNs 직접 발송의 최상위 payload는 content.data가 없어도 읽는다', () => {
  const notification: Notifications.Notification = {
    date: 1,
    request: {
      identifier: 'remote-42',
      trigger: { type: 'push', payload: { aps: { 'content-available': 1 }, ...payload } },
      content: {
        title: null,
        subtitle: null,
        body: null,
        sound: null,
        categoryIdentifier: null,
        badge: null,
        launchImageName: null,
        attachments: [],
        threadIdentifier: null,
      },
    },
  };
  expect(getNotificationPushPayload(notification)).toEqual(payload);
});

it('동시 수신과 재전달은 일반 문구의 배너 하나로 표시하고 서버 본문은 노출하지 않는다', async () => {
  await Promise.all([
    presentPushNotification({ ...payload, body: '민감한 업무 내용' }),
    presentPushNotification(payload),
  ]);
  await presentPushNotification(payload);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
    identifier: 'baton:1:42',
    content: {
      title: '새로운 인수인계가 도착했어요',
      body: '앱에서 내용을 확인해주세요.',
      sound: 'default',
      data: { ...payload, userId: 1, localPush: true },
    },
    trigger: null,
  });
});

it('로그아웃 상태와 권한 거부 상태에는 알림을 표시하지 않는다', async () => {
  storage.remove(PUSH_USER_KEY);
  await presentPushNotification(payload);
  storage.set(PUSH_USER_KEY, 1);
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ ...granted, granted: false });
  await presentPushNotification(payload);
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('권한 확인 중 계정이 바뀌면 이전 사용자의 알림을 표시하지 않는다', async () => {
  jest.mocked(Notifications.getPermissionsAsync).mockImplementationOnce(async () => {
    storage.set(PUSH_USER_KEY, 2);
    return granted;
  });
  await presentPushNotification(payload);
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('표시 실패한 알림은 다시 수신했을 때 재시도한다', async () => {
  jest.mocked(Notifications.scheduleNotificationAsync).mockRejectedValueOnce(new Error('failed'));
  await expect(presentPushNotification(payload)).rejects.toThrow('failed');
  await presentPushNotification(payload);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
});
