import { beforeEach, expect, it, jest } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { presentPushNotification } from '@/features/notifications/lib/pushPresentation';
import { registerBackgroundNotifications } from '@/features/notifications/lib/backgroundNotifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  registerTaskAsync: jest.fn<() => Promise<null>>().mockResolvedValue(null),
  BackgroundNotificationTaskResult: { NewData: 0, NoData: 1, Failed: 2 },
}));
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isAvailableAsync: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
  isTaskRegisteredAsync: jest.fn<() => Promise<boolean>>().mockResolvedValue(false),
}));
jest.mock('@/features/notifications/lib/pushPresentation', () => ({
  PUSH_USER_KEY: 'notifications.active-user',
  presentPushNotification: jest.fn<() => Promise<void>>().mockResolvedValue(),
}));
jest.mock('@/shared/lib/mmkvStorage', () => ({ storage: { getNumber: () => 1 } }));
jest.mock('@/shared/lib/logger', () => ({ logger: { error: jest.fn() } }));

const task = jest.mocked(TaskManager.defineTask).mock.calls[0][1];
const executionInfo = { eventId: 'event-1', taskName: 'baton-background-notifications' };
beforeEach(() => {
  jest.mocked(presentPushNotification).mockClear();
});

it('컴포넌트 없이 로드한 백그라운드 작업이 iOS data-only 수신을 표시 처리로 전달한다', async () => {
  const data = { workspaceId: '101', notificationId: '42', type: 'HANDOVER_RECEIVED' };
  const result = await task({
    data: { data, notification: null, aps: { 'content-available': 1 } },
    error: null,
    executionInfo,
  });
  expect(presentPushNotification).toHaveBeenCalledWith(data);
  expect(result).toBe(Notifications.BackgroundNotificationTaskResult.NewData);
});

it('이미 표시할 내용이 있는 푸시와 배너 탭은 다시 로컬 알림으로 만들지 않는다', async () => {
  await task({ data: { data: {}, notification: { title: '알림' } }, error: null, executionInfo });
  await task({ data: { actionIdentifier: 'default' }, error: null, executionInfo });
  expect(presentPushNotification).not.toHaveBeenCalled();
});

it('등록된 백그라운드 작업을 중복 등록하지 않는다', async () => {
  // 모듈 최초 로드의 자동 등록이 완료된 뒤 수동 등록을 검사한다.
  await Promise.resolve();
  await Promise.resolve();
  jest.mocked(Notifications.registerTaskAsync).mockClear();
  jest.mocked(TaskManager.isTaskRegisteredAsync).mockResolvedValue(true);
  await registerBackgroundNotifications();
  expect(Notifications.registerTaskAsync).not.toHaveBeenCalled();
});
