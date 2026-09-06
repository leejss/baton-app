import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { mockHandoffRepository } from '@/features/handoffs/api/mockHandoffRepository';
import { HandoffListScreen } from '@/features/handoffs/screens/HandoffListScreen';

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
    jest
      .spyOn(mockHandoffRepository, 'list')
      .mockImplementation(() => new Promise<never>(() => {}));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });

    await render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <QueryClientProvider client={queryClient}>
          <HandoffListScreen
            scope="all"
            onCreate={jest.fn()}
            onEdit={jest.fn()}
            onNotificationPress={jest.fn()}
            onOpen={jest.fn()}
            onScopeChange={jest.fn()}
          />
        </QueryClientProvider>
      </SafeAreaProvider>,
    );

    expect(screen.getByLabelText('카페 바톤 강남점, 관리자')).toBeOnTheScreen();
    expect(screen.getByLabelText('전체 인수인계')).toBeOnTheScreen();
    expect(screen.getByLabelText('인수인계 글쓰기')).toBeOnTheScreen();
    expect(screen.queryByText('마감 정산 확인 부탁드려요')).not.toBeOnTheScreen();
  });
});
