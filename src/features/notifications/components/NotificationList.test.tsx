import { afterEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import * as notificationApi from '@/features/notifications/api/notification.api';
import { notificationQueries } from '@/features/notifications/api/notification.queries';
import { toNotification } from '@/features/notifications/api/mappers';
import type { NotificationDto } from '@/features/notifications/api/notification.schema';
import { NotificationList } from '@/features/notifications/components/NotificationList';
import { AppError } from '@/shared/api/errors';
import { createTestClient, MainTestProvider } from '@/test/MainTestProvider';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
  useRouter: () => ({ push: mockPush }),
  useNavigation: () => ({ isFocused: () => true }),
}));

const clients: ReturnType<typeof createTestClient>[] = [];

afterEach(async () => {
  await cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  jest.useRealTimers();
  jest.restoreAllMocks();
  mockPush.mockReset();
});

it('공지 읽음 오류는 닫기 버튼 없이 표시되고 2초 뒤 사라진다', async () => {
  jest.useFakeTimers();
  const notification: NotificationDto = {
    id: 1,
    workspaceId: 101,
    type: 'UPDATE_ANNOUNCEMENT',
    title: '서비스 소식',
    status: 'READ',
    createdAt: '2026-09-18T10:00:00+09:00',
  };
  const inbox = { items: [notification], unreadCount: 0, badgeText: '' };
  jest.spyOn(notificationApi, 'fetchNotifications').mockResolvedValue(inbox);
  jest
    .spyOn(notificationApi, 'markNotificationRead')
    .mockRejectedValue(new AppError('server', '요청한 정보를 찾을 수 없습니다.', { status: 404 }));

  const client = createTestClient();
  client.setMutationDefaults(['notifications', 'read'], { gcTime: Infinity });
  clients.push(client);
  client.setQueryData(notificationQueries.list({ workspaceId: 101, userId: 1 }).queryKey, {
    ...inbox,
    items: [toNotification(notification)],
  });
  await render(
    <MainTestProvider client={client}>
      <NotificationList />
    </MainTestProvider>,
  );

  const item = screen.getByRole('button', { name: /서비스 공지, 서비스 소식/ });
  await fireEvent.press(item);
  expect(
    await screen.findByText('읽음 처리에 실패했어요. 알림을 다시 선택해주세요.'),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: '닫기' })).not.toBeOnTheScreen();
  expect(mockPush).not.toHaveBeenCalled();

  await act(async () => jest.advanceTimersByTime(2000));
  expect(
    screen.queryByText('읽음 처리에 실패했어요. 알림을 다시 선택해주세요.'),
  ).not.toBeOnTheScreen();

  await fireEvent.press(item);
  expect(
    await screen.findByText('읽음 처리에 실패했어요. 알림을 다시 선택해주세요.'),
  ).toBeOnTheScreen();
  await act(async () => jest.advanceTimersByTime(2000));
  expect(
    screen.queryByText('읽음 처리에 실패했어요. 알림을 다시 선택해주세요.'),
  ).not.toBeOnTheScreen();
});
