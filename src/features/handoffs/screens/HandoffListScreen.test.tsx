import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as api from '@/features/handoffs/api/handoff.api';
import * as notifications from '@/features/notifications/api/notification.api';
import { TEST_CONTEXT } from '@/test/MainTestProvider';
import { MainContextProvider } from '@/features/stores/hooks/useMainContext';
import { HandoffListScreen } from '@/features/handoffs/screens/HandoffListScreen';
import type { HandoffScope } from '@/features/handoffs/types';
import { INITIAL_MOCK_HANDOFFS } from '@/test/fixtures/handoffs';

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
  it('발신에서 전체로 돌아오면 전체 쿼리의 항목을 표시한다', async () => {
    const sent = INITIAL_MOCK_HANDOFFS[0];
    const received = INITIAL_MOCK_HANDOFFS[1];
    jest.spyOn(api, 'fetchHandoffs').mockImplementation(async (_workspaceId, scope) => ({
      items: scope === 'SENT' ? [sent] : [sent, received],
      nextCursor: null,
      hasNext: false,
    }));
    jest
      .spyOn(notifications, 'fetchNotifications')
      .mockResolvedValue({ items: [], unreadCount: 0, badgeText: '' });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });

    function TestScreen() {
      const [scope, setScope] = useState<HandoffScope>('all');
      return (
        <HandoffListScreen
          scope={scope}
          onEdit={jest.fn()}
          onOpen={jest.fn()}
          onScopeChange={setScope}
        />
      );
    }

    await render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <QueryClientProvider client={queryClient}>
          <MainContextProvider value={TEST_CONTEXT}>
            <TestScreen />
          </MainContextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>,
    );

    expect(await screen.findByText(received.title)).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('발신 인수인계'));
    await waitFor(() => expect(screen.queryByText(received.title)).not.toBeOnTheScreen());
    await fireEvent.press(screen.getByLabelText('전체 인수인계'));
    expect(await screen.findByText(received.title)).toBeOnTheScreen();
  });

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
              onEdit={jest.fn()}
              onOpen={jest.fn()}
              onScopeChange={jest.fn()}
            />
          </MainContextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>,
    );

    expect(await screen.findByLabelText('카페 바톤, 관리자')).toBeOnTheScreen();
    expect(screen.getByLabelText('전체 인수인계')).toBeOnTheScreen();
    expect(screen.queryByLabelText('인수인계 글쓰기')).not.toBeOnTheScreen();
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
