import 'react-native-gesture-handler/jestSetup';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, beforeAll, afterEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMockScheduleDataSource } from '@/test/fixtures/schedules';
import { monthlyScheduleSchema } from '@/features/schedules/api/schedule.schema';
import { ScheduleEditorScreen } from '@/test/ScheduleScreens';
import { MOCK_STORE_MEMBERS } from '@/test/fixtures/members';

jest.mock('@expo/ui/community/bottom-sheet', () =>
  jest.requireActual('@/shared/ui/__mocks__/expoBottomSheet'),
);

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
  useRouter: () => ({
    dismissTo: mockDismissTo,
    back: jest.fn(),
    canGoBack: () => true,
  }),
  useNavigation: () => ({ dispatch: jest.fn() }),
}));
jest.mock('expo-router/react-navigation', () => ({
  usePreventRemove: jest.fn(),
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
  jest.setSystemTime(new Date('2026-09-07T00:00:00Z'));
});

async function chooseEmployee() {
  await fireEvent.press(await screen.findByLabelText('이서연, seoyeon@baton.app'));
  await fireEvent.press(screen.getByLabelText('근무자 선택 완료'));
  await fireEvent(screen.getByLabelText('근무자 선택 완료'), 'onDismiss');
}

async function enterTime(start = '0900', end = '1200') {
  await fireEvent.press(screen.getByLabelText('다음'));
  await fireEvent.changeText(screen.getByLabelText('출근 시간'), start);
  await fireEvent.changeText(screen.getByLabelText('퇴근 시간'), end);
  await fireEvent.press(screen.getByLabelText('다음'));
}

describe('관리자 근무 등록·수정', () => {
  it.each(['2026-08-06', '2026-09-31', '2027-01-01'])(
    '등록 불가 초기 날짜 %s는 비우고 처음 누른 미래 날짜만 선택한다',
    async (initialDate) => {
      const source = createMockScheduleDataSource({ schedules: [] });
      await mount(<ScheduleEditorScreen source={source} initialDate={initialDate} />);
      await chooseEmployee();
      expect(screen.getByText('2026년 9월')).toBeOnTheScreen();
      expect(screen.getByLabelText('다음')).toBeDisabled();
      await fireEvent.press(screen.getByLabelText('9월 15일 화, 근무 0건'));
      expect(screen.getByText(/2026-09-15 ~ 2026-09-15 · 1일 선택/)).toBeOnTheScreen();
      expect(screen.getByLabelText('다음')).toBeEnabled();
    },
  );

  it.each(['팝업', '입력 화면'])(
    '%s에서 혼합 실패를 재시도하면 저장 오류 날짜만 전송하고 성공·시작 경과 결과를 보존한다',
    async (location) => {
      const source = createMockScheduleDataSource({
        schedules: [],
        failDatesOnce: ['2026-09-09'],
      });
      const create = jest.spyOn(source, 'create');
      await mount(<ScheduleEditorScreen source={source} initialDate="2026-09-07" />);
      await chooseEmployee();
      await fireEvent.press(screen.getByLabelText('9월 9일 수, 근무 0건'));
      await enterTime('0800');
      await fireEvent.press(screen.getByLabelText('등록'));
      expect(
        await screen.findByText(
          '1건을 등록했습니다. 등록하지 못한 2건 중 1건을 다시 시도할 수 있습니다.',
        ),
      ).toBeOnTheScreen();
      if (location === '입력 화면') {
        await fireEvent.press(screen.getByLabelText('입력 내용으로 돌아가기'));
        expect(screen.getByLabelText('출근 시간')).toHaveProp('editable', false);
        expect(screen.getByLabelText('이전')).toBeDisabled();
      }
      await fireEvent.press(screen.getAllByLabelText('실패한 날짜만 재시도').slice(-1)[0]);
      expect(
        await screen.findByText(
          '2건을 등록했습니다. 등록하지 못한 1건 중 0건을 다시 시도할 수 있습니다.',
        ),
      ).toBeOnTheScreen();
      await fireEvent.press(screen.getByLabelText('입력 내용으로 돌아가기'));
      expect(screen.getByText('재시도할 날짜: 2026-09-07')).toBeOnTheScreen();
      expect(screen.getByLabelText('실패한 날짜만 재시도')).toBeDisabled();
      expect(create.mock.calls.map(([, request]) => [request.startDate, request.endDate])).toEqual([
        ['2026-09-07', '2026-09-09'],
        ['2026-09-09', '2026-09-09'],
      ]);
      const items = monthlyScheduleSchema.parse(await source.month(101, '2026-09')).schedules;
      expect(items.map((item) => item.workDate)).toEqual(['2026-09-08', '2026-09-09']);
    },
  );

  it('재시도 전에 시작 시각이 지나면 서버 결과에 따라 재시도 불가로 전환한다', async () => {
    const source = createMockScheduleDataSource({ schedules: [], failDatesOnce: ['2026-09-07'] });
    const create = jest.spyOn(source, 'create');
    await mount(<ScheduleEditorScreen source={source} initialDate="2026-09-07" />);
    await chooseEmployee();
    await enterTime('1000');
    await fireEvent.press(screen.getByLabelText('등록'));
    await screen.findByText('등록하지 못한 근무가 있어요.');
    jest.setSystemTime(new Date('2026-09-07T01:00:00Z'));
    await fireEvent.press(screen.getAllByLabelText('실패한 날짜만 재시도').slice(-1)[0]);
    expect(
      await screen.findByText(
        '0건을 등록했습니다. 등록하지 못한 1건 중 0건을 다시 시도할 수 있습니다.',
      ),
    ).toBeOnTheScreen();
    expect(create).toHaveBeenCalledTimes(2);
    expect(monthlyScheduleSchema.parse(await source.month(101, '2026-09')).schedules).toHaveLength(
      0,
    );
  });

  it('전체 저장 실패 뒤 직원·날짜·시간을 유지하고 전체 실패 날짜를 재시도한다', async () => {
    const source = createMockScheduleDataSource({
      schedules: [],
      failDatesOnce: ['2026-09-15', '2026-09-16'],
    });
    const create = jest.spyOn(source, 'create');
    await mount(<ScheduleEditorScreen source={source} initialDate="2026-09-15" />);
    await chooseEmployee();
    await fireEvent.press(screen.getByLabelText('9월 16일 수, 근무 0건'));
    await enterTime();
    await fireEvent.press(screen.getByLabelText('등록'));
    await screen.findByText('등록하지 못한 근무가 있어요.');
    await fireEvent.press(screen.getByLabelText('입력 내용으로 돌아가기'));
    expect(screen.getByText('이서연')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('09:00')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('12:00')).toBeOnTheScreen();
    expect(screen.getByText('재시도할 날짜: 2026-09-15, 2026-09-16')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('실패한 날짜만 재시도'));
    expect(await screen.findByText('근무 등록 완료!')).toBeOnTheScreen();
    expect(create.mock.calls.map(([, request]) => [request.startDate, request.endDate])).toEqual([
      ['2026-09-15', '2026-09-16'],
      ['2026-09-15', '2026-09-16'],
    ]);
  });

  it('중복 확인 취소는 입력을 유지하고 재등록 동의 후 중복 날짜만 제외한다', async () => {
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
    const create = jest.spyOn(source, 'create');
    await mount(<ScheduleEditorScreen source={source} initialDate="2026-09-15" />);
    await chooseEmployee();
    await fireEvent.press(screen.getByLabelText('9월 16일 수, 근무 0건'));
    await enterTime();
    await fireEvent.press(screen.getByLabelText('등록'));
    await screen.findByText('이미 등록된 근무가 있어요.');
    await fireEvent.press(screen.getByLabelText('이전으로'));
    expect(screen.getByDisplayValue('09:00')).toBeOnTheScreen();
    expect(screen.getByText('이서연')).toBeOnTheScreen();
    expect(monthlyScheduleSchema.parse(await source.month(101, '2026-09')).schedules).toHaveLength(
      1,
    );
    await fireEvent.press(screen.getByLabelText('등록'));
    await screen.findByText('이미 등록된 근무가 있어요.');
    await fireEvent.press(screen.getByLabelText('중복 제외하고 등록'));
    expect(await screen.findByText('근무 등록 완료!')).toBeOnTheScreen();
    expect(screen.getByText(/중복 1건은 제외했습니다/)).toBeOnTheScreen();
    expect(create.mock.calls.map(([, request]) => request.acceptNonDuplicates)).toEqual([
      false,
      false,
      true,
    ]);
    expect(monthlyScheduleSchema.parse(await source.month(101, '2026-09')).schedules).toHaveLength(
      2,
    );
  });

  it.each(['2401', '0900', '0800'])(
    '잘못된 퇴근 시간 %s는 다음 단계 진행을 차단한다',
    async (end) => {
      const source = createMockScheduleDataSource({ schedules: [] });
      const create = jest.spyOn(source, 'create');
      await mount(<ScheduleEditorScreen source={source} initialDate="2026-09-15" />);
      await chooseEmployee();
      await enterTime('0900', end);
      expect(screen.queryByLabelText('등록')).not.toBeOnTheScreen();
      expect(screen.getByLabelText('다음')).toBeOnTheScreen();
      expect(create).not.toHaveBeenCalled();
    },
  );

  it('수정 화면에 진입한 뒤 원래 근무가 시작되어도 저장을 차단한다', async () => {
    jest.setSystemTime(new Date('2026-09-07T00:59:00Z'));
    const source = createMockScheduleDataSource({
      schedules: [
        {
          id: 12,
          employee: MOCK_STORE_MEMBERS[1],
          workDate: '2026-09-07',
          startTime: '10:00',
          endTime: '12:00',
          status: 'ACTIVE',
        },
      ],
    });
    const update = jest.spyOn(source, 'update');
    await mount(<ScheduleEditorScreen source={source} scheduleId="12" />);
    await screen.findByText('이서연');
    await enterTime('1100');
    jest.setSystemTime(new Date('2026-09-07T01:00:00Z'));
    await fireEvent.press(screen.getByLabelText('수정 완료'));
    expect(
      screen.getByText('이미 시작된 근무는 수정할 수 없습니다. 날짜와 시간을 확인해주세요.'),
    ).toBeOnTheScreen();
    expect(update).not.toHaveBeenCalled();
  });
  it('직원→날짜→시간→확인 단계를 통해 등록하고 달력으로 복귀한다', async () => {
    const source = createMockScheduleDataSource({ schedules: [] });
    await mount(<ScheduleEditorScreen source={source} initialDate="2026-09-15" />);
    await fireEvent.press(await screen.findByLabelText('이서연, seoyeon@baton.app'));
    await fireEvent.press(screen.getByLabelText('근무자 선택 완료'));
    // 다음 단계는 네이티브 시트가 완전히 닫힌 뒤 표시한다.
    expect(screen.queryByText(/1일 선택/)).not.toBeOnTheScreen();
    await fireEvent(screen.getByLabelText('근무자 선택 완료'), 'onDismiss');
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
    const source = createMockScheduleDataSource({
      schedules: [],
      failDatesOnce: ['2026-09-16'],
    });
    const create = jest.spyOn(source, 'create');
    await mount(<ScheduleEditorScreen source={source} initialDate="2026-09-15" />);
    await fireEvent.press(await screen.findByLabelText('이서연, seoyeon@baton.app'));
    await fireEvent.press(screen.getByLabelText('근무자 선택 완료'));
    await fireEvent(screen.getByLabelText('근무자 선택 완료'), 'onDismiss');
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
    expect(items[0]).toMatchObject({
      id: 12,
      workDate: '2026-09-16',
      endTime: '14:00',
    });
  });
  it('직원 목록 조회가 실패해도 검색 입력과 닫기를 유지한다', async () => {
    const source = createMockScheduleDataSource({
      schedules: [],
      failMembers: true,
    });
    await mount(<ScheduleEditorScreen source={source} />);
    expect(await screen.findByText('직원 목록을 불러오지 못했습니다.')).toBeOnTheScreen();
    expect(screen.getByLabelText('직원 이름 검색')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('근무자 선택 닫기'));
    expect(screen.getByText('근무등록')).toBeOnTheScreen();
  });
});
