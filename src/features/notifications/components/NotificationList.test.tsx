import { afterEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import * as notificationApi from '@/features/notifications/api/notification.api';
import { notificationQueries } from '@/features/notifications/api/notification.queries';
import { toNotification } from '@/features/notifications/api/mappers';
import type { NotificationDto } from '@/features/notifications/api/notification.schema';
import { NotificationList } from '@/features/notifications/components/NotificationList';
import * as scheduleApi from '@/features/schedules/api/schedule.api';
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

it('삭제된 근무일정 오류는 닫기 버튼 없이 표시되고 2초 뒤 사라진다', async () => {
  jest.useFakeTimers();
  const notification: NotificationDto = {
    id: 1,
    type: 'SCHEDULE_CHANGED',
    title: '삭제된 근무 일정',
    scheduleId: 10,
    status: 'READ',
    createdAt: '2026-09-18T10:00:00+09:00',
  };
  const inbox = { items: [notification], unreadCount: 0, badgeText: '' };
  jest.spyOn(notificationApi, 'fetchNotifications').mockResolvedValue(inbox);
  jest.spyOn(notificationApi, 'markNotificationRead').mockResolvedValue(notification);
  jest
    .spyOn(scheduleApi, 'fetchSchedule')
    .mockRejectedValue(new AppError('server', '요청한 정보를 찾을 수 없습니다.', { status: 404 }));

  const client = createTestClient();
  client.setMutationDefaults(['notifications', 'read'], { gcTime: Infinity });
  clients.push(client);
  client.setQueryData(notificationQueries.list({ storeId: 101, userId: 1 }).queryKey, {
    ...inbox,
    items: [toNotification(notification)],
  });
  await render(
    <MainTestProvider client={client}>
      <NotificationList />
    </MainTestProvider>,
  );

  const item = screen.getByRole('button', { name: /근무 일정 알림, 삭제된 근무 일정/ });
  await fireEvent.press(item);
  expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: '닫기' })).not.toBeOnTheScreen();
  expect(mockPush).not.toHaveBeenCalled();

  await act(async () => jest.advanceTimersByTime(2000));
  expect(screen.queryByText('요청한 정보를 찾을 수 없습니다.')).not.toBeOnTheScreen();

  await fireEvent.press(item);
  expect(await screen.findByText('요청한 정보를 찾을 수 없습니다.')).toBeOnTheScreen();
  await act(async () => jest.advanceTimersByTime(2000));
  expect(screen.queryByText('요청한 정보를 찾을 수 없습니다.')).not.toBeOnTheScreen();
});
