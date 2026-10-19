import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '@/features/auth/store/authStore';
import { registerPushToken, disableCurrentPushToken } from '@/features/notifications/api/push.api';
import { usePushNotifications } from '@/features/notifications/hooks/usePushNotifications';
import { requestNotificationPermission } from '@/features/notifications/lib/notificationPermissions';
import { resumePushRegistration } from '@/features/notifications/lib/pushRegistration';

const mockPush = jest.fn();
const mockRouter = { push: mockPush };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('@/features/auth/store/authStore', () => {
  const { create } = jest.requireActual<typeof import('zustand')>('zustand');
  return { useAuthStore: create(() => ({ status: 'restoring', session: null })) };
});
jest.mock('@/features/notifications/api/push.api');
jest.mock('@/features/notifications/lib/backgroundNotifications', () => ({
  registerBackgroundNotifications: jest.fn<() => Promise<void>>().mockResolvedValue(),
}));
jest.mock('@/features/notifications/lib/pushPresentation', () => ({
  PUSH_USER_KEY: 'notifications.active-user',
  parsePushPayload: (data: unknown) => data,
  getNotificationPushPayload: (notification: Notifications.Notification) =>
    notification.request.content.data,
  presentPushNotification: jest.fn<() => Promise<void>>().mockResolvedValue(),
}));
jest.mock('@/features/notifications/lib/notificationPermissions', () => ({
  requestNotificationPermission: jest.fn<() => Promise<void>>().mockResolvedValue(),
  canReceiveNotifications: (value: { granted: boolean }) => value.granted,
  subscribeNotificationPermissions: () => () => {},
}));
jest.mock('@/shared/lib/mmkvStorage', () => ({ storage: { set: jest.fn(), remove: jest.fn() } }));
jest.mock('@/shared/lib/deviceId', () => ({
  getDeviceId: jest.fn<() => Promise<string>>().mockResolvedValue('login-device-id'),
}));
jest.mock('@/shared/lib/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
  addPushTokenListener: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  clearLastNotificationResponseAsync: jest.fn(),
  dismissAllNotificationsAsync: jest.fn(),
}));

const granted: Notifications.NotificationPermissionsStatus = {
  granted: true,
  canAskAgain: true,
  expires: 'never',
  status: 'granted' as Notifications.PermissionStatus,
};
let client: QueryClient;
function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function login() {
  // 이 훅은 세션의 사용자 ID만 사용한다. 인증 저장소의 전체 계약은 별도 테스트한다.
  useAuthStore.setState({ status: 'signedIn', session: { user: { id: 1 } } } as Partial<
    ReturnType<typeof useAuthStore.getState>
  >);
}

beforeEach(() => {
  jest.clearAllMocks();
  resumePushRegistration();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  AppState.currentState = 'active';
  onlineManager.setOnline(true);
  useAuthStore.setState({ status: 'signedOut', session: null });
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(granted);
  jest
    .mocked(Notifications.getDevicePushTokenAsync)
    .mockResolvedValue({ type: 'ios', data: 'native-apns-token' });
  jest.mocked(Notifications.addPushTokenListener).mockReturnValue({ remove: jest.fn() });
  jest.mocked(Notifications.addNotificationReceivedListener).mockReturnValue({ remove: jest.fn() });
  jest
    .mocked(Notifications.addNotificationResponseReceivedListener)
    .mockReturnValue({ remove: jest.fn() });
  jest.mocked(Notifications.getLastNotificationResponseAsync).mockResolvedValue(null);
  jest.mocked(Notifications.clearLastNotificationResponseAsync).mockResolvedValue();
  jest.mocked(Notifications.dismissAllNotificationsAsync).mockResolvedValue();
  jest
    .mocked(registerPushToken)
    .mockResolvedValue({ id: 1, deviceId: 'login-device-id', platform: 'IOS', status: 'ACTIVE' });
  jest.mocked(disableCurrentPushToken).mockResolvedValue();
});
afterEach(async () => {
  await cleanup();
  client.clear();
});

it('로그인 전에는 등록하지 않고 로그인 성공 후 APNs 토큰과 로그인 기기 ID를 등록한다', async () => {
  await renderHook(usePushNotifications, { wrapper: Wrapper });
  expect(Notifications.getDevicePushTokenAsync).not.toHaveBeenCalled();
  await act(async () => {
    login();
  });
  await waitFor(() =>
    expect(registerPushToken).toHaveBeenCalledWith(
      { token: 'native-apns-token', deviceId: 'login-device-id', platform: 'IOS' },
      expect.any(AbortSignal),
    ),
  );
  expect(requestNotificationPermission).toHaveBeenCalled();
});

it('자동 로그인으로 복원된 세션도 등록하고 갱신 토큰을 재발급 없이 서버에 반영한다', async () => {
  login();
  await renderHook(usePushNotifications, { wrapper: Wrapper });
  await waitFor(() => expect(registerPushToken).toHaveBeenCalledTimes(1));
  const callback = jest.mocked(Notifications.addPushTokenListener).mock.calls[0][0];
  await act(async () => {
    callback({ type: 'ios', data: 'rotated-apns-token' });
  });
  await waitFor(() => expect(registerPushToken).toHaveBeenCalledTimes(2));
  expect(Notifications.getDevicePushTokenAsync).toHaveBeenCalledTimes(1);
});

it('권한을 거부하면 토큰을 발급하지 않고 기존 서버 토큰을 비활성화한다', async () => {
  login();
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ ...granted, granted: false });
  await renderHook(usePushNotifications, { wrapper: Wrapper });
  await waitFor(() => expect(disableCurrentPushToken).toHaveBeenCalledTimes(1));
  expect(Notifications.getDevicePushTokenAsync).not.toHaveBeenCalled();
  expect(registerPushToken).not.toHaveBeenCalled();
});

it('등록 네트워크 실패 후 연결이 복구되면 재시도한다', async () => {
  login();
  jest.mocked(registerPushToken).mockRejectedValueOnce(new Error('offline'));
  await renderHook(usePushNotifications, { wrapper: Wrapper });
  await waitFor(() => expect(registerPushToken).toHaveBeenCalledTimes(1));
  await act(async () => {
    onlineManager.setOnline(false);
    onlineManager.setOnline(true);
  });
  await waitFor(() => expect(registerPushToken).toHaveBeenCalledTimes(2));
});

it('토큰 발급을 기다리는 중 로그아웃하면 이전 사용자의 토큰을 등록하지 않는다', async () => {
  login();
  let finish!: (token: Notifications.DevicePushToken) => void;
  jest.mocked(Notifications.getDevicePushTokenAsync).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await renderHook(usePushNotifications, { wrapper: Wrapper });
  await waitFor(() => expect(Notifications.getDevicePushTokenAsync).toHaveBeenCalledTimes(1));
  await act(async () => {
    useAuthStore.setState({ status: 'signedOut', session: null });
  });
  await act(async () => {
    finish({ type: 'ios', data: 'late-apns-token' });
  });
  expect(registerPushToken).not.toHaveBeenCalled();
});

it('Android 네이티브 토큰은 ANDROID 플랫폼으로 등록한다', async () => {
  login();
  jest
    .mocked(Notifications.getDevicePushTokenAsync)
    .mockResolvedValue({ type: 'android', data: 'native-fcm-token' });
  await renderHook(usePushNotifications, { wrapper: Wrapper });
  await waitFor(() =>
    expect(registerPushToken).toHaveBeenCalledWith(
      { token: 'native-fcm-token', deviceId: 'login-device-id', platform: 'ANDROID' },
      expect.any(AbortSignal),
    ),
  );
});

it('현재 사용자의 배너를 누르면 알림 목록으로 한 번 이동하고 다른 계정의 배너는 무시한다', async () => {
  login();
  await renderHook(usePushNotifications, { wrapper: Wrapper });
  await waitFor(() => expect(registerPushToken).toHaveBeenCalledTimes(1));
  const response: Notifications.NotificationResponse = {
    actionIdentifier: 'default',
    notification: {
      date: 1,
      request: {
        identifier: 'local-42',
        trigger: null,
        content: {
          title: '알림',
          body: '확인해주세요',
          subtitle: null,
          categoryIdentifier: null,
          sound: 'default',
          badge: null,
          launchImageName: null,
          attachments: [],
          threadIdentifier: null,
          data: {
            localPush: true,
            userId: 2,
            workspaceId: '101',
            notificationId: '42',
            type: 'HANDOVER_RECEIVED',
          },
        },
      },
    },
  };
  const listener = jest.mocked(Notifications.addNotificationResponseReceivedListener).mock
    .calls[0][0];
  await act(async () => {
    listener(response);
  });
  expect(mockPush).not.toHaveBeenCalled();
  response.notification.request.content.data = {
    ...response.notification.request.content.data,
    userId: 1,
  };
  await act(async () => {
    listener(response);
    listener(response);
  });
  expect(mockPush).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith('/notifications');
});
