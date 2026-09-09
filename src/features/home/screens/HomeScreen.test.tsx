import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { HomeDataSource } from '@/features/home/api/home.dataSource';
import { createMockHomeDataSource } from '@/features/home/api/home.mockDataSource';
import type { NotificationDataSource } from '@/features/notifications/api/notification.dataSource';
import { notificationQueries } from '@/features/notifications/api/notification.queries';
import { MainHeader } from '@/features/tabs/components/MainHeader';
import { HomeScreen } from '@/features/home/screens/HomeScreen';

const mockPush = jest.fn();
const mockNavigate = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, navigate: mockNavigate }),
}));

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, right: 0, bottom: 34, left: 0 },
};
const queryClients = new Set<QueryClient>();

function createTestQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  queryClients.add(queryClient);
  return queryClient;
}

function createNotificationSource(unreadCount = 0, shouldFail = false): NotificationDataSource {
  return {
    key: 'home-header-notifications',
    async list() {
      if (shouldFail) throw new Error('알림 조회 실패');
      return {
        items: Array.from({ length: unreadCount }, (_, index) => ({
          id: index + 1,
          type: 'UPDATE_ANNOUNCEMENT',
          title: '서비스 공지',
          status: 'UNREAD',
          createdAt: new Date().toISOString(),
        })),
        unreadCount,
        badgeText: unreadCount > 99 ? '99+' : String(unreadCount),
      };
    },
    async markRead() {
      throw new Error('헤더는 읽음 처리를 호출하지 않습니다.');
    },
  };
}

async function renderWithProviders(element: ReactElement, queryClient = createTestQueryClient()) {
  return render(
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <QueryClientProvider client={queryClient}>{element}</QueryClientProvider>
    </SafeAreaProvider>,
  );
}

describe('HomeScreen', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockNavigate.mockReset();
  });

  afterEach(async () => {
    await cleanup();
    for (const queryClient of queryClients) queryClient.clear();
    queryClients.clear();
  });

  it('메인 화면들은 같은 매장·역할·알림을 공유하고 뒤로가기를 표시하지 않는다', async () => {
    const dataSource = createMockHomeDataSource({ unreadCount: 120 });
    const getMyStore = jest.spyOn(dataSource, 'getMyStore');
    const getMyProfile = jest.spyOn(dataSource, 'getMyProfile');
    const notificationSource = createNotificationSource(120);
    const getNotifications = jest.spyOn(notificationSource, 'list');
    const client = createTestQueryClient();

    for (const title of [undefined, '근무표', '인수인계', '마이페이지']) {
      const view = await renderWithProviders(
        <MainHeader
          title={title}
          dataSource={dataSource}
          notificationSource={notificationSource}
        />,
        client,
      );
      expect(await screen.findByLabelText('카페 바톤 강남점, 관리자')).toBeOnTheScreen();
      expect(await screen.findByLabelText('알림, 읽지 않은 알림 99+개')).toBeOnTheScreen();
      expect(screen.queryByLabelText('뒤로 가기')).not.toBeOnTheScreen();
      if (title !== undefined) expect(screen.getByText(title)).toBeOnTheScreen();
      await fireEvent.press(screen.getByLabelText('알림, 읽지 않은 알림 99+개'));
      expect(mockNavigate).toHaveBeenLastCalledWith('/notifications');
      await view.unmount();
    }
    expect(getMyStore).toHaveBeenCalledTimes(1);
    expect(getMyProfile).toHaveBeenCalledTimes(1);
    expect(getNotifications).toHaveBeenCalledTimes(1);
  });

  it('메인 헤더의 매장 조회 실패를 재시도하고 읽지 않은 알림이 없으면 배지를 숨긴다', async () => {
    const dataSource = createMockHomeDataSource({ unreadCount: 0 });
    jest.spyOn(dataSource, 'getMyStore').mockRejectedValueOnce(new Error('일시적인 조회 실패'));
    await renderWithProviders(
      <MainHeader
        title="근무표"
        dataSource={dataSource}
        notificationSource={createNotificationSource()}
      />,
    );
    await fireEvent.press(await screen.findByLabelText('매장 정보 다시 조회'));
    expect(await screen.findByLabelText('카페 바톤 강남점, 관리자')).toBeOnTheScreen();
    expect(screen.getByText('근무표')).toBeOnTheScreen();
    expect(screen.getByLabelText('알림')).toBeOnTheScreen();
    expect(screen.queryByLabelText(/읽지 않은 알림/)).not.toBeOnTheScreen();
  });

  it('정상 홈을 표시하고 모든 연결 route에 parameter를 전달한다', async () => {
    await renderWithProviders(
      <HomeScreen dataSource={createMockHomeDataSource()} initialDate="2026-09-06" />,
    );

    expect(await screen.findByText('김지원님')).toBeOnTheScreen();
    expect(screen.getByText('총 3건')).toBeOnTheScreen();
    expect(screen.getByText('이서연')).toBeOnTheScreen();

    const storeTag = screen.getByLabelText('카페 바톤 강남점, 관리자');
    expect(storeTag).toHaveStyle({ maxWidth: 200 });

    await fireEvent.press(screen.getByLabelText('알림, 읽지 않은 알림 3개'));
    await fireEvent.press(screen.getByLabelText('전체 인수인계 자세히 보기'));
    await fireEvent.press(screen.getByLabelText('이서연님에게 인수인계 작성'));

    expect(mockPush).toHaveBeenCalledWith('/notifications');
    expect(mockNavigate).toHaveBeenCalledWith('/handoffs?scope=ALL');
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/handoffs/new',
      params: { recipientId: '2' },
    });

    await fireEvent.press(screen.getByLabelText('9월 1일 화요일'));
    expect(await screen.findByText('9월 1일 화')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('9월 1일 화 월간 근무표 보기'));

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/schedules',
      params: { selectedDate: '2026-09-01' },
    });
  });

  it('다른 날짜를 조회하는 동안 카드를 유지하고 근무 일정만 로딩한다', async () => {
    const baseDataSource = createMockHomeDataSource();
    let resolveSelectedDate!: (response: unknown) => void;
    const selectedDateResponse = new Promise<unknown>((resolve) => {
      resolveSelectedDate = resolve;
    });
    const getHome = jest.fn((storeId: number, date: string, signal?: AbortSignal) =>
      date === '2026-09-01' ? selectedDateResponse : baseDataSource.getHome(storeId, date, signal),
    );
    const dataSource: HomeDataSource = {
      ...baseDataSource,
      getHome,
    };

    await renderWithProviders(<HomeScreen dataSource={dataSource} initialDate="2026-09-06" />);

    expect(await screen.findByText('9월 6일 일')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('9월 1일 화요일'));

    expect(screen.getByText('새 인수인계')).toBeOnTheScreen();
    expect(screen.getByText('9월 1일 화')).toBeOnTheScreen();
    expect(screen.getByLabelText('9월 1일 화요일').props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByText('근무 일정을 불러오는 중입니다.')).toBeOnTheScreen();
    expect(screen.queryByText('홈 정보를 불러오는 중입니다.')).not.toBeOnTheScreen();
    expect(getHome).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveSelectedDate(await baseDataSource.getHome(101, '2026-09-01'));
    });

    await waitFor(() => {
      expect(screen.queryByText('근무 일정을 불러오는 중입니다.')).not.toBeOnTheScreen();
    });
    expect(screen.getByText('이서연')).toBeOnTheScreen();
  });

  it('확인 후 순서와 총건수를 유지하며 버튼과 취소선을 갱신한다', async () => {
    await renderWithProviders(
      <HomeScreen dataSource={createMockHomeDataSource()} initialDate="2026-09-06" />,
    );

    const confirmButton = await screen.findByLabelText('신규 재고 위치 확인 확인');
    await fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(
        screen.getByLabelText('신규 재고 위치 확인 확인').props.accessibilityState,
      ).toMatchObject({
        disabled: true,
      });
    });
    expect(screen.getByText('신규 재고 위치 확인')).toHaveStyle({
      textDecorationLine: 'line-through',
    });
    expect(screen.getByText('총 3건')).toBeOnTheScreen();
    expect(screen.getAllByLabelText(/ 확인$/).map(({ props }) => props.accessibilityLabel)).toEqual(
      ['마감 정산 영수증 확인 확인', '신규 재고 위치 확인 확인', '오픈 전 기기 상태 확인 확인'],
    );
  });

  it('인수인계와 일정의 빈 상태를 명세 문구로 표시한다', async () => {
    await renderWithProviders(
      <HomeScreen
        dataSource={createMockHomeDataSource({
          handoffs: [],
          receivedHandoverCount: 0,
          scheduleFactory: () => [],
        })}
        initialDate="2026-09-06"
      />,
    );

    expect(await screen.findByText('총 0건')).toBeOnTheScreen();
    expect(screen.getByText('전달받은 인수인계가 없어요')).toBeOnTheScreen();
    expect(screen.getByText('해당 날짜에 등록된 근무 일정이 없습니다.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('전체 인수인계 자세히 보기')).not.toBeOnTheScreen();
  });

  it('context 실패는 전체 화면에서, 홈 요약 실패는 각 카드에서 처리한다', async () => {
    const contextRender = await renderWithProviders(
      <HomeScreen
        dataSource={createMockHomeDataSource({ contextFailure: true })}
        initialDate="2026-09-06"
      />,
    );

    expect(
      await screen.findByText('홈 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('김지원님')).not.toBeOnTheScreen();
    await contextRender.unmount();

    await renderWithProviders(
      <HomeScreen
        dataSource={createMockHomeDataSource({ homeFailure: true })}
        initialDate="2026-09-06"
      />,
    );

    expect(await screen.findByText('김지원님')).toBeOnTheScreen();
    expect(
      await screen.findByText('인수인계를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('근무 일정을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('새 인수인계')).toBeOnTheScreen();
  });

  it('알림 갱신 실패 시 마지막 badge를 유지하고 최초 실패면 숨긴다', async () => {
    const cachedClient = createTestQueryClient();
    const notificationSource = createNotificationSource(0, true);
    cachedClient.setQueryData(
      notificationQueries.list(notificationSource, { storeId: 101, userId: 1 }).queryKey,
      {
        items: [],
        unreadCount: 8,
      },
      { updatedAt: 1 },
    );

    const cachedRender = await renderWithProviders(
      <MainHeader
        dataSource={createMockHomeDataSource()}
        notificationSource={notificationSource}
      />,
      cachedClient,
    );

    expect(await screen.findByLabelText('알림, 읽지 않은 알림 8개')).toBeOnTheScreen();
    await cachedRender.unmount();

    await renderWithProviders(
      <MainHeader
        dataSource={createMockHomeDataSource()}
        notificationSource={notificationSource}
      />,
    );

    expect(await screen.findByLabelText('카페 바톤 강남점, 관리자')).toBeOnTheScreen();
    await waitFor(() => expect(screen.getByLabelText('알림')).toBeOnTheScreen());
    expect(screen.queryByLabelText(/읽지 않은 알림/)).not.toBeOnTheScreen();
  });

  it('확인 실패는 재시도를 제공하고 이미 확인된 응답은 최신 상태를 반영한다', async () => {
    const failureRender = await renderWithProviders(
      <HomeScreen
        dataSource={createMockHomeDataSource({ confirmFailureIds: [302] })}
        initialDate="2026-09-06"
      />,
    );

    await fireEvent.press(await screen.findByLabelText('신규 재고 위치 확인 확인'));
    expect(
      await screen.findByText('인수인계를 확인 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('인수인계 확인 다시 시도')).toBeOnTheScreen();
    await failureRender.unmount();

    await renderWithProviders(
      <HomeScreen
        dataSource={createMockHomeDataSource({ alreadyConfirmedOnConfirmIds: [302] })}
        initialDate="2026-09-06"
      />,
    );

    await fireEvent.press(await screen.findByLabelText('신규 재고 위치 확인 확인'));
    expect(await screen.findByText('이미 확인된 인수인계입니다.')).toBeOnTheScreen();
    await waitFor(() => {
      expect(
        screen.getByLabelText('신규 재고 위치 확인 확인').props.accessibilityState,
      ).toMatchObject({
        disabled: true,
      });
    });
    expect(screen.queryByLabelText('인수인계 확인 다시 시도')).not.toBeOnTheScreen();
  });
});
