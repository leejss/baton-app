import 'react-native-gesture-handler/jestSetup';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, beforeAll, afterEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMockScheduleDataSource } from '@/test/fixtures/schedules';
import { SchedulesScreen } from '@/test/ScheduleScreens';
import type { ScheduleDto } from '@/features/schedules/api/schedule.schema';
import { MOCK_STORE_MEMBERS } from '@/test/fixtures/members';

jest.mock('@shopify/flash-list', () => ({
  FlashList: jest.requireActual<typeof import('react-native')>('react-native').FlatList,
}));

jest.mock('@expo/ui/community/bottom-sheet', () =>
  jest.requireActual('@/shared/ui/__mocks__/expoBottomSheet'),
);

jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    navigate: jest.fn(),
    back: jest.fn(),
    canGoBack: () => false,
  }),
}));

// 달력과 시작 시각 검증은 고정한 서울 날짜로 검사하고 비동기 조회 타이머는 실제로 실행한다.
beforeAll(() => {
  jest.useFakeTimers({
    now: new Date('2026-09-07T00:00:00Z'),
    doNotFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'setImmediate',
      'clearImmediate',
      'nextTick',
      'queueMicrotask',
      'performance',
    ],
  });
});
afterAll(() => {
  jest.useRealTimers();
});

const clients: QueryClient[] = [];
const now = () => new Date('2026-09-07T00:00:00Z');
function schedule(
  id: number,
  hour: number,
  employee: ScheduleDto['employee'] = MOCK_STORE_MEMBERS[0],
): ScheduleDto {
  return {
    id,
    workspaceId: 101,
    employee,
    workDate: '2026-09-15',
    startTime: `${String(hour).padStart(2, '0')}:00`,
    endTime: `${String(hour + 1).padStart(2, '0')}:00`,
    status: 'ACTIVE',
  };
}
const pagedSchedules = Array.from({ length: 7 }, (_, index) =>
  schedule(index + 1, 9 + index, MOCK_STORE_MEMBERS[index === 6 ? 1 : 0]),
);
const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, right: 0, bottom: 34, left: 0 },
};
async function mount(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  clients.push(client);
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={client}>{element}</QueryClientProvider>
    </SafeAreaProvider>,
  );
}
afterEach(async () => {
  await cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  jest.restoreAllMocks();
  mockPush.mockReset();
});

describe('근무표 화면의 로컬 조회 경계', () => {
  it('본인과 시간이 겹치는 다른 직원도 표시하고 두 일정에는 더보기를 숨긴다', async () => {
    const source = createMockScheduleDataSource({
      now,
      schedules: [schedule(2, 9, MOCK_STORE_MEMBERS[1]), schedule(1, 9)],
    });
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    expect(await screen.findByText('이서연')).toBeOnTheScreen();
    expect(screen.queryByLabelText('이서연님에게 인수인계 작성')).toBeNull();
    expect(screen.getAllByText('09:00 - 10:00')).toHaveLength(2);
    expect(screen.getByText('총 2명')).toBeOnTheScreen();
    expect(screen.queryByLabelText('전체 근무 일정 더 보기')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('9월 15일 화, 근무 2건')).toBeOnTheScreen();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('일정이 정확히 세 개면 모두 표시하고 더보기를 숨긴다', async () => {
    const source = createMockScheduleDataSource({ now, schedules: pagedSchedules.slice(0, 3) });
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    expect(await screen.findByText('11:00 - 12:00')).toBeOnTheScreen();
    expect(screen.getByText('총 1명')).toBeOnTheScreen();
    expect(screen.queryByLabelText('전체 근무 일정 더 보기')).not.toBeOnTheScreen();
  });

  it('세 개씩 이어서 조회하고 일정 건수와 전체 고유 직원 수를 구분한다', async () => {
    const source = createMockScheduleDataSource({ now, schedules: pagedSchedules });
    const daily = jest.spyOn(source, 'daily');
    const month = jest.spyOn(source, 'month');
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    expect(await screen.findByText('총 2명')).toBeOnTheScreen();
    expect(screen.getByLabelText('9월 15일 화, 근무 7건')).toBeOnTheScreen();
    expect(screen.getByLabelText('9월 16일 수, 근무 0건')).toBeOnTheScreen();
    expect(screen.queryByText('12:00 - 13:00')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('전체 근무 일정 더 보기'));
    expect(await screen.findByText('14:00 - 15:00')).toBeOnTheScreen();
    expect(screen.getByText('09:00 - 10:00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('전체 근무 일정 더 보기'));
    expect(await screen.findByText('15:00 - 16:00')).toBeOnTheScreen();
    expect(screen.queryByLabelText('전체 근무 일정 더 보기')).not.toBeOnTheScreen();
    expect(daily.mock.calls.map(([, date, cursor]) => [date, cursor])).toEqual([
      ['2026-09-15', undefined],
      ['2026-09-15', '3'],
      ['2026-09-15', '6'],
    ]);
    await fireEvent.press(screen.getByLabelText('9월 16일 수, 근무 0건'));
    expect(
      await screen.findByText(/해당 날짜에 등록된\s+근무 일정이 없습니다\./),
    ).toBeOnTheScreen();
    expect(daily.mock.calls.at(-1)?.slice(0, 3)).toEqual([101, '2026-09-16', undefined]);
    expect(month).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('15:00 - 16:00')).not.toBeOnTheScreen();
  });

  it('다음 페이지 실패 시 기존 목록을 유지하고 같은 커서로 재시도한다', async () => {
    const source = createMockScheduleDataSource({ now, schedules: pagedSchedules.slice(0, 4) });
    const originalDaily = source.daily;
    const daily = jest
      .spyOn(source, 'daily')
      .mockImplementationOnce(originalDaily)
      .mockRejectedValueOnce(new Error('연결 실패'))
      .mockImplementation(originalDaily);
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    await fireEvent.press(await screen.findByLabelText('전체 근무 일정 더 보기'));
    expect(
      await screen.findByText('다음 근무 일정을 불러오지 못했습니다. 다시 시도해주세요.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('09:00 - 10:00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('근무 일정 더 보기 다시 시도'));
    expect(await screen.findByText('12:00 - 13:00')).toBeOnTheScreen();
    expect(daily.mock.calls.map(([, , cursor]) => cursor)).toEqual([undefined, '3', '3']);
    expect(
      screen.queryByText('다음 근무 일정을 불러오지 못했습니다. 다시 시도해주세요.'),
    ).not.toBeOnTheScreen();
  });

  it('더보기 중 중복 요청을 막고 날짜 전환 후 이전 날짜 응답을 표시하지 않는다', async () => {
    const source = createMockScheduleDataSource({ now, schedules: pagedSchedules });
    const originalDaily = source.daily;
    let resolvePage: (page: unknown) => void = () => {
      throw new Error('요청이 시작되지 않았습니다.');
    };
    const daily = jest
      .spyOn(source, 'daily')
      .mockImplementation((workspaceId, date, cursor, signal) =>
        cursor === undefined
          ? originalDaily(workspaceId, date, cursor, signal)
          : new Promise((resolve) => {
              resolvePage = resolve;
            }),
      );
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    await fireEvent.press(await screen.findByLabelText('전체 근무 일정 더 보기'));
    await fireEvent.press(screen.getByLabelText('전체 근무 일정 더 보기'));
    await waitFor(() => expect(screen.getByLabelText('전체 근무 일정 더 보기')).toBeDisabled());
    expect(daily).toHaveBeenCalledTimes(2);
    await fireEvent.press(screen.getByLabelText('9월 16일 수, 근무 0건'));
    expect(
      await screen.findByText(/해당 날짜에 등록된\s+근무 일정이 없습니다\./),
    ).toBeOnTheScreen();
    const page = await originalDaily(101, '2026-09-15', '3');
    await act(async () => resolvePage(page));
    expect(screen.queryByText('12:00 - 13:00')).not.toBeOnTheScreen();
    expect(screen.getByText('총 0명')).toBeOnTheScreen();
  });

  it('관리 화면에서도 다음 페이지 일정을 삭제하고 달력과 날짜별 목록을 갱신한다', async () => {
    const source = createMockScheduleDataSource({ now, schedules: pagedSchedules.slice(0, 4) });
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" isManaging />);
    await fireEvent.press(await screen.findByLabelText('전체 근무 일정 더 보기'));
    await fireEvent.press(await screen.findByLabelText('김지원 12:00 근무 선택'));
    await fireEvent.press(await screen.findByLabelText('삭제'));
    await fireEvent.press(screen.getByLabelText('삭제 확인'));
    expect(await screen.findByText('삭제 완료')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('확인'));
    await waitFor(() => expect(screen.getByLabelText('9월 15일 화, 근무 3건')).toBeOnTheScreen());
    expect(screen.queryByLabelText('김지원 12:00 근무 선택')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('전체 근무 일정 더 보기')).not.toBeOnTheScreen();
  });

  it('날짜별 최초 조회 실패 시 재시도로 목록을 복원한다', async () => {
    const source = createMockScheduleDataSource({ now, schedules: [schedule(1, 9)] });
    jest.spyOn(source, 'daily').mockRejectedValueOnce(new Error('날짜별 조회 실패'));
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    expect(await screen.findByText('날짜별 조회 실패')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('다시 시도'));
    expect(await screen.findByText('09:00 - 10:00')).toBeOnTheScreen();
  });

  it('관리 화면에는 뒤로가기를 표시하고 메인 헤더의 알림은 표시하지 않는다', async () => {
    await mount(
      <SchedulesScreen
        source={createMockScheduleDataSource({ now, schedules: [] })}
        initialDate="2026-09-15"
        isManaging
      />,
    );
    expect(
      await screen.findByText(/해당 날짜에 등록된\s+근무 일정이 없습니다\./),
    ).toBeOnTheScreen();
    expect(screen.getByText('근무수정/삭제')).toBeOnTheScreen();
    expect(screen.getByLabelText('뒤로 가기')).toBeOnTheScreen();
    expect(screen.getByLabelText(/^알림/)).toBeOnTheScreen();
  });
  it('월간 조회가 대기 중이어도 날짜별 일정은 독립적으로 불러온다', async () => {
    const source = createMockScheduleDataSource({ now });
    jest.spyOn(source, 'month').mockImplementation(() => new Promise<never>(() => {}));
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    expect(await screen.findByText('근무표')).toBeOnTheScreen();
    expect(screen.queryByLabelText('뒤로 가기')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('조회 월 선택')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('9월 16일 수, 근무 0건'));
    expect(screen.getByLabelText('9월 16일 수, 근무 0건').props.accessibilityState.selected).toBe(
      true,
    );
    expect(await screen.findByText('08:00 - 12:00')).toBeOnTheScreen();
  });
  it('실패한 월을 유지하면서 월 선택과 재시도를 제공한다', async () => {
    const source = createMockScheduleDataSource({ now, failMonth: true });
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    expect((await screen.findAllByText('근무표를 불러오지 못했습니다.')).length).toBeGreaterThan(0);
    expect(screen.getByText('2026년 9월')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('조회 월 선택'));
    await fireEvent.press(screen.getByLabelText('2026년 10월'));
    await fireEvent(screen.getByLabelText('조회 월 선택 닫기'), 'onDismiss');
    expect(screen.getByText('2026년 10월')).toBeOnTheScreen();
    expect((await screen.findAllByText('근무표를 불러오지 못했습니다.')).length).toBeGreaterThan(0);
  });
  it('일반 멤버도 편집 진입과 빈 날짜 달력을 사용할 수 있다', async () => {
    const source = createMockScheduleDataSource({
      now,
      role: 'MEMBER',
      schedules: [],
    });
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    expect(
      await screen.findByText(/해당 날짜에 등록된\s+근무 일정이 없습니다\./),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('근무편집')).toBeOnTheScreen();
    expect(screen.getByLabelText('9월 15일 화, 근무 0건').props.accessibilityState.selected).toBe(
      true,
    );
  });
  it('관리자에게 등록과 수정·삭제 선택을 제공한다', async () => {
    const source = createMockScheduleDataSource({ now, schedules: [] });
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    await fireEvent.press(await screen.findByLabelText('근무편집'));
    await fireEvent.press(screen.getByLabelText('근무등록'));
    expect(mockPush).not.toHaveBeenCalled();
    // Jest에는 네이티브 전환이 없으므로 시트의 닫기 완료 이벤트를 전달한다.
    await fireEvent(screen.getByLabelText('어떤 일을 처리하나요? 닫기'), 'onDismiss');
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/schedules/new',
      params: { selectedDate: '2026-09-15' },
    });
  });
});
