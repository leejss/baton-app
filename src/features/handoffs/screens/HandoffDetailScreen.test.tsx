import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { INITIAL_MOCK_HANDOFFS } from '@/features/handoffs/api/mockHandoffData';
import { HandoffDetailScreen } from '@/features/handoffs/screens/HandoffDetailScreen';

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, right: 0, bottom: 34, left: 0 },
};

afterEach(async () => {
  await cleanup();
});

describe('HandoffDetailScreen', () => {
  it('작성자가 보낸 인수인계와 확인 상태를 상세 화면에 표시한다', async () => {
    const handoff = INITIAL_MOCK_HANDOFFS[0];
    if (handoff === undefined) throw new Error('상세 화면 테스트 데이터가 없습니다.');

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
    });
    queryClient.setQueryData(handoffQueries.detail(handoff.id).queryKey, handoff);

    await render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <QueryClientProvider client={queryClient}>
          <HandoffDetailScreen
            handoffId={handoff.id}
            onBack={jest.fn()}
            onDeleted={jest.fn()}
            onEdit={jest.fn()}
            onHome={jest.fn()}
          />
        </QueryClientProvider>
      </SafeAreaProvider>,
    );

    expect(screen.getByText('업무 처리')).toBeOnTheScreen();
    expect(screen.getByText(handoff.title)).toBeOnTheScreen();
    expect(screen.getByText('박민주님께')).toBeOnTheScreen();
    expect(screen.getByText('확인중')).toBeOnTheScreen();
    expect(screen.getByLabelText('인수인계 수정 및 삭제 메뉴')).toBeOnTheScreen();
  });
});
