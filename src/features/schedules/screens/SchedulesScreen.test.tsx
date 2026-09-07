import 'react-native-gesture-handler/jestSetup';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, beforeAll, afterEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMockScheduleDataSource } from '@/features/schedules/api/mockScheduleDataSource';
import { SchedulesScreen } from '@/features/schedules/screens/SchedulesScreen';

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
  it('관리 화면에는 뒤로가기를 표시하고 메인 헤더의 알림은 표시하지 않는다', async () => {
    await mount(
      <SchedulesScreen
        source={createMockScheduleDataSource({ now, schedules: [] })}
        initialDate="2026-09-15"
        isManaging
      />,
    );
    expect(await screen.findByText('해당 날짜에 등록된 근무 일정이 없습니다.')).toBeOnTheScreen();
    expect(screen.getByText('근무수정/삭제')).toBeOnTheScreen();
    expect(screen.getByLabelText('뒤로 가기')).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^알림/)).not.toBeOnTheScreen();
  });
  it('월간 조회가 대기 중이어도 헤더·월 선택·날짜 선택을 유지한다', async () => {
    const source = createMockScheduleDataSource({ now });
    jest.spyOn(source, 'month').mockImplementation(() => new Promise<never>(() => {}));
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    expect(screen.getByText('근무표')).toBeOnTheScreen();
    expect(screen.queryByLabelText('뒤로 가기')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('조회 월 선택')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('9월 16일 수, 근무 0건'));
    expect(screen.getByLabelText('9월 16일 수, 근무 0건').props.accessibilityState.selected).toBe(
      true,
    );
    expect(await screen.findByText('근무자 목록을 불러오는 중입니다.')).toBeOnTheScreen();
  });
  it('실패한 월을 유지하면서 월 선택과 재시도를 제공한다', async () => {
    const source = createMockScheduleDataSource({ now, failMonth: true });
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    expect(await screen.findByText('근무표를 불러오지 못했습니다.')).toBeOnTheScreen();
    expect(screen.getByText('2026년 9월')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('조회 월 선택'));
    await fireEvent.press(screen.getByLabelText('2026년 10월'));
    expect(screen.getByText('2026년 10월')).toBeOnTheScreen();
    expect(await screen.findByText('근무표를 불러오지 못했습니다.')).toBeOnTheScreen();
  });
  it('직원에게 편집 진입을 숨기고 빈 날짜의 달력은 유지한다', async () => {
    const source = createMockScheduleDataSource({ now, role: 'EMPLOYEE', schedules: [] });
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    expect(await screen.findByText('해당 날짜에 등록된 근무 일정이 없습니다.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('근무편집')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('9월 15일 화, 근무 0건').props.accessibilityState.selected).toBe(
      true,
    );
  });
  it('관리자에게 등록과 수정·삭제 선택을 제공한다', async () => {
    const source = createMockScheduleDataSource({ now, schedules: [] });
    await mount(<SchedulesScreen source={source} initialDate="2026-09-15" />);
    await fireEvent.press(await screen.findByLabelText('근무편집'));
    await fireEvent.press(screen.getByLabelText('근무등록'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/schedules/new',
      params: { selectedDate: '2026-09-15' },
    });
  });
});
