import { MainContextProvider } from '@/features/stores/hooks/useMainContext';
import { TEST_CONTEXT } from '@/test/MainTestProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as api from '@/features/handoffs/api/handoff.api';
import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { INITIAL_MOCK_HANDOFFS } from '@/test/fixtures/handoffs';
import { HandoffDetailScreen } from '@/features/handoffs/screens/HandoffDetailScreen';

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, right: 0, bottom: 34, left: 0 },
};
const clients: QueryClient[] = [];

afterEach(async () => {
  await cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  jest.restoreAllMocks();
});

describe('HandoffDetailScreen', () => {
  it('보낸 사람과 담당자가 아닌 멤버는 상세를 열고 확인·관리 동작은 받지 않는다', async () => {
    const handoff = INITIAL_MOCK_HANDOFFS[0];
    const confirm = jest.spyOn(api, 'confirmHandoff');
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
    });
    clients.push(queryClient);
    queryClient.setQueryData(handoffQueries.detail(101, handoff.id).queryKey, handoff);
    await render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <QueryClientProvider client={queryClient}>
          <MainContextProvider
            value={{
              ...TEST_CONTEXT,
              userId: 999,
              canManage: false,
              profile: { ...TEST_CONTEXT.profile, id: 999 },
              membership: { ...TEST_CONTEXT.membership, role: 'MEMBER' },
            }}
          >
            <HandoffDetailScreen
              handoffId={String(handoff.id)}
              onBack={jest.fn()}
              onDeleted={jest.fn()}
              onEdit={jest.fn()}
              onHome={jest.fn()}
            />
          </MainContextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>,
    );
    expect(screen.getByText(handoff.title)).toBeOnTheScreen();
    expect(screen.getByText(handoff.body)).toBeOnTheScreen();
    expect(screen.queryByLabelText('확인 하기')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('인수인계 수정 및 삭제 메뉴')).not.toBeOnTheScreen();
    expect(confirm).not.toHaveBeenCalled();
  });
  it('작성자가 보낸 인수인계와 확인 상태를 상세 화면에 표시한다', async () => {
    const handoff = INITIAL_MOCK_HANDOFFS[0];
    if (handoff === undefined) throw new Error('상세 화면 테스트 데이터가 없습니다.');

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      },
    });
    clients.push(queryClient);
    queryClient.setQueryData(handoffQueries.detail(101, handoff.id).queryKey, handoff);

    const onBack = jest.fn();
    const onHome = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <QueryClientProvider client={queryClient}>
          <MainContextProvider value={TEST_CONTEXT}>
            <HandoffDetailScreen
              handoffId={String(handoff.id)}
              onBack={onBack}
              onDeleted={jest.fn()}
              onEdit={jest.fn()}
              onHome={onHome}
            />
          </MainContextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>,
    );

    await fireEvent.press(screen.getByLabelText('뒤로 가기'));
    await fireEvent.press(screen.getByLabelText('홈으로 이동'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onHome).toHaveBeenCalledTimes(1);

    expect(screen.getByText('업무 처리')).toBeOnTheScreen();
    expect(screen.getByText(handoff.title)).toBeOnTheScreen();
    expect(screen.getByText('이서연님께')).toBeOnTheScreen();
    expect(screen.getByText('확인중')).toBeOnTheScreen();
    expect(screen.getByLabelText('인수인계 수정 및 삭제 메뉴')).toBeOnTheScreen();
  });

  it('수신자가 확인을 완료하면 성공 알림을 표시하고 CTA를 중복 실행하지 않는다', async () => {
    const handoff = INITIAL_MOCK_HANDOFFS[1];
    if (handoff === undefined) throw new Error('수신 인수인계 테스트 데이터가 없습니다.');
    const confirmed = {
      ...handoff,
      status: 'CONFIRMED' as const,
      recipient: { ...handoff.recipient, confirmedAt: '2026-09-16T10:00:00+09:00' },
    };
    jest.spyOn(api, 'fetchHandoff').mockResolvedValueOnce(handoff).mockResolvedValue(confirmed);
    jest.spyOn(api, 'confirmHandoff').mockResolvedValue(confirmed);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });
    clients.push(queryClient);
    queryClient.setQueryData(handoffQueries.detail(101, handoff.id).queryKey, handoff);

    await render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <QueryClientProvider client={queryClient}>
          <MainContextProvider value={TEST_CONTEXT}>
            <HandoffDetailScreen
              handoffId={String(handoff.id)}
              onBack={jest.fn()}
              onDeleted={jest.fn()}
              onEdit={jest.fn()}
              onHome={jest.fn()}
            />
          </MainContextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>,
    );

    expect(screen.getByText('박현우님 보냄')).toBeOnTheScreen();
    expect(screen.queryByText('김지원님께')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('확인 하기'));
    expect(await screen.findByText('확인 완료했습니다.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('확인 하기')).not.toBeOnTheScreen();
    expect(screen.getByText('확인 완료')).toBeOnTheScreen();
    expect(screen.getByText('박현우님 보냄')).toBeOnTheScreen();
    expect(api.confirmHandoff).toHaveBeenCalledTimes(1);
  });
});
