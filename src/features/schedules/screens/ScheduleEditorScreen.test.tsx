import 'react-native-gesture-handler/jestSetup';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, beforeAll, afterEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMockScheduleDataSource } from '@/features/schedules/api/mockScheduleDataSource';
import { monthlyScheduleSchema } from '@/features/schedules/api/schedule.schema';
import { ScheduleEditorScreen } from '@/features/schedules/screens/ScheduleEditorScreen';
import { MOCK_STORE_MEMBERS } from '@/shared/api/mockMembers';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);
// Jest에는 native layout 측정이 없어 가상 목록의 렌더링만 RN의 테스트 가능한 목록으로 대체한다.
jest.mock('@shopify/flash-list', () => ({
  FlashList: jest.requireActual<typeof import('react-native')>('react-native').FlatList,
}));
const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ dismissTo: mockDismissTo, back: jest.fn(), canGoBack: () => true }),
  useNavigation: () => ({ dispatch: jest.fn() }),
}));
jest.mock('expo-router/react-navigation', () => ({ usePreventRemove: jest.fn() }));

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
  mockDismissTo.mockReset();
});

describe('관리자 근무 등록·수정', () => {
  it('직원→날짜→시간→확인 단계를 통해 등록하고 달력으로 복귀한다', async () => {
    const source = createMockScheduleDataSource({ schedules: [] });
    await mount(<ScheduleEditorScreen source={source} initialDate="2026-09-15" />);
    await fireEvent.press(await screen.findByLabelText('이서연, seoyeon@baton.app'));
    await fireEvent.press(screen.getByLabelText('근무자 선택 완료'));
    expect(screen.getByText(/1일 선택/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('다음'));
    await fireEvent.changeText(screen.getByLabelText('출근 시간'), '1800');
    await fireEvent.changeText(screen.getByLabelText('퇴근 시간'), '2400');
    await fireEvent.press(screen.getByLabelText('다음'));
    expect(screen.getByText(/6시간/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('등록'));
    expect(await screen.findByText('근무 등록 완료!')).toBeOnTheScreen();
    const items = monthlyScheduleSchema.parse(await source.month(101, '2026-09')).schedules;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      employee: { userId: 2 },
      workDate: '2026-09-15',
      startTime: '18:00',
      endTime: '24:00',
    });
    await fireEvent.press(screen.getByLabelText('확인'));
    expect(mockDismissTo).toHaveBeenCalledWith({
      pathname: '/schedules',
      params: { selectedDate: '2026-09-15' },
    });
  });
  it('부분 저장 뒤 폼에서 재시도해도 실패한 날짜만 저장한다', async () => {
    const source = createMockScheduleDataSource({ schedules: [], failDatesOnce: ['2026-09-16'] });
    const create = jest.spyOn(source, 'create');
    await mount(<ScheduleEditorScreen source={source} initialDate="2026-09-15" />);
    await fireEvent.press(await screen.findByLabelText('이서연, seoyeon@baton.app'));
    await fireEvent.press(screen.getByLabelText('근무자 선택 완료'));
    await fireEvent.press(screen.getByLabelText('9월 16일 수, 근무 0건'));
    await fireEvent.press(screen.getByLabelText('다음'));
    await fireEvent.changeText(screen.getByLabelText('출근 시간'), '0900');
    await fireEvent.changeText(screen.getByLabelText('퇴근 시간'), '1200');
    await fireEvent.press(screen.getByLabelText('다음'));
    await fireEvent.press(screen.getByLabelText('등록'));
    await screen.findByText('등록하지 못한 근무가 있어요.');
    await fireEvent.press(screen.getByLabelText('입력 내용으로 돌아가기'));
    expect(screen.getByDisplayValue('09:00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('실패한 날짜만 재시도'));
    expect(await screen.findByText('근무 등록 완료!')).toBeOnTheScreen();
    expect(create.mock.calls.map(([, request]) => [request.startDate, request.endDate])).toEqual([
      ['2026-09-15', '2026-09-16'],
      ['2026-09-16', '2026-09-16'],
    ]);
    expect(monthlyScheduleSchema.parse(await source.month(101, '2026-09')).schedules).toHaveLength(
      2,
    );
  });
  it('수정은 기존 직원을 유지하고 날짜 한 건과 시간만 바꾼다', async () => {
    const source = createMockScheduleDataSource({
      schedules: [
        {
          id: 12,
          employee: MOCK_STORE_MEMBERS[1],
          workDate: '2026-09-15',
          startTime: '09:00',
          endTime: '12:00',
          status: 'ACTIVE',
        },
      ],
    });
    await mount(<ScheduleEditorScreen source={source} scheduleId="12" />);
    await screen.findByText('이서연');
    await fireEvent.press(screen.getByLabelText('9월 16일 수, 근무 0건'));
    await fireEvent.press(screen.getByLabelText('다음'));
    expect(screen.getByDisplayValue('09:00')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('퇴근 시간'), '1400');
    await fireEvent.press(screen.getByLabelText('다음'));
    await fireEvent.press(screen.getByLabelText('수정 완료'));
    expect(await screen.findByText('근무 수정 완료!')).toBeOnTheScreen();
    const items = monthlyScheduleSchema.parse(await source.month(101, '2026-09')).schedules;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 12, workDate: '2026-09-16', endTime: '14:00' });
  });
  it('직원 목록 조회가 실패해도 검색 입력과 닫기를 유지한다', async () => {
    const source = createMockScheduleDataSource({ schedules: [], failMembers: true });
    await mount(<ScheduleEditorScreen source={source} />);
    expect(await screen.findByText('직원 목록을 불러오지 못했습니다.')).toBeOnTheScreen();
    expect(screen.getByLabelText('직원 이름 검색')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('근무자 선택 닫기'));
    expect(screen.getByText('근무등록')).toBeOnTheScreen();
  });
});
