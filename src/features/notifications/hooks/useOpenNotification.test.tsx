import { afterEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import * as api from '@/features/notifications/api/notification.api';
import { useOpenNotification } from '@/features/notifications/hooks/useOpenNotification';
import { notificationQueries } from '@/features/notifications/api/notification.queries';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useNavigation: () => ({ isFocused: () => true }),
}));
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
  mockPush.mockReset();
});
it('읽음 처리 실패가 상세 이동을 막지 않고 배지 캐시를 유지한다', async () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  });
  const scope = { storeId: 101, userId: 1 };
  const key = notificationQueries.list(scope).queryKey;
  client.setQueryData(key, { items: [], unreadCount: 2, badgeText: '2' });
  jest.spyOn(api, 'markNotificationRead').mockRejectedValue(new Error('오프라인'));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useOpenNotification(scope), {
    wrapper,
  });
  await act(() =>
    result.current.open({
      id: '1',
      kind: 'handoffReceived',
      heading: '알림',
      message: '',
      createdAt: 0,
      expiresAt: Infinity,
      timeLabel: '',
      isUnread: true,
      target: { kind: 'handoff', id: '102' },
    }),
  );
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/handoffs/[handoffId]',
    params: { handoffId: '102' },
  });
  expect(client.getQueryData(key)).toMatchObject({ unreadCount: 2 });
  client.clear();
});

it('원본이 사라진 알림의 오류 안내를 2초 후 자동으로 닫는다', async () => {
  jest.useFakeTimers();
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
  });
  const scope = { storeId: 101, userId: 1 };
  jest.spyOn(api, 'markNotificationRead').mockRejectedValue(new Error('알림을 찾을 수 없어요.'));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result, unmount } = await renderHook(() => useOpenNotification(scope), { wrapper });

  await act(() =>
    result.current.open({
      id: 'deleted-notification',
      kind: 'schedule',
      heading: '근무 일정',
      message: '삭제된 근무 일정',
      createdAt: 0,
      expiresAt: Infinity,
      timeLabel: '',
      isUnread: true,
      target: { kind: 'none' },
    }),
  );

  expect(result.current.message).toBe('읽음 처리에 실패했어요. 알림을 다시 선택해주세요.');
  await act(async () => {
    jest.advanceTimersByTime(2000);
    await Promise.resolve();
  });
  expect(result.current.message).toBeUndefined();
  unmount();
  client.clear();
});
