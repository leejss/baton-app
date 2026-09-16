import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as api from '@/features/handoffs/api/handoff.api';
import * as notifications from '@/features/notifications/api/notification.api';
import { TEST_CONTEXT } from '@/test/MainTestProvider';
import { MainContextProvider } from '@/features/stores/hooks/useMainContext';
import { HandoffListScreen } from '@/features/handoffs/screens/HandoffListScreen';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, right: 0, bottom: 34, left: 0 },
};

afterEach(async () => {
  await cleanup();
  jest.restoreAllMocks();
});

describe('HandoffListScreen', () => {
  it('목록 쿼리가 대기 중이어도 헤더와 탭을 유지한다', async () => {
    jest.spyOn(api, 'fetchHandoffs').mockImplementation(() => new Promise<never>(() => {}));
    jest
      .spyOn(notifications, 'fetchNotifications')
      .mockResolvedValue({ items: [], unreadCount: 0, badgeText: '' });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });

    await render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <QueryClientProvider client={queryClient}>
          <MainContextProvider value={TEST_CONTEXT}>
            <HandoffListScreen
              scope="all"
              onCreate={jest.fn()}
              onEdit={jest.fn()}
              onOpen={jest.fn()}
              onScopeChange={jest.fn()}
            />
          </MainContextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>,
    );

    expect(await screen.findByLabelText('카페 바톤 강남점, 관리자')).toBeOnTheScreen();
    expect(screen.getByLabelText('전체 인수인계')).toBeOnTheScreen();
    expect(screen.getByLabelText('인수인계 글쓰기')).toBeOnTheScreen();
    expect(screen.queryByText('마감 정산 확인 부탁드려요')).not.toBeOnTheScreen();
  });

  it('인수인계가 없을 때 Figma 빈 상태 문구를 표시한다', async () => {
    jest.spyOn(api, 'fetchHandoffs').mockResolvedValue({
      items: [],
      nextCursor: null,
      hasNext: false,
    });
    jest
      .spyOn(notifications, 'fetchNotifications')
      .mockResolvedValue({ items: [], unreadCount: 0, badgeText: '' });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });

    await render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <QueryClientProvider client={queryClient}>
          <MainContextProvider value={TEST_CONTEXT}>
            <HandoffListScreen
              scope="sent"
              onCreate={jest.fn()}
              onEdit={jest.fn()}
              onOpen={jest.fn()}
              onScopeChange={jest.fn()}
            />
          </MainContextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>,
    );

    expect(await screen.findByText(/인수인계가 없어요/)).toBeOnTheScreen();
    expect(screen.getByText(/새 인수인계를 작성해보세요/)).toBeOnTheScreen();
  });
});
