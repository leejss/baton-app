import 'react-native-gesture-handler/jestSetup';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, beforeAll, afterEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMockScheduleDataSource } from '@/test/fixtures/schedules';
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

async function enterTime() {
  await fireEvent.press(await screen.findByLabelText('다음'));
  await fireEvent.changeText(screen.getByLabelText('출근 시간'), '0900');
  await fireEvent.changeText(screen.getByLabelText('퇴근 시간'), '1200');
  await fireEvent.press(screen.getByLabelText('다음'));
}
describe('본인 근무 단일 날짜 등록', () => {
  it.each(['ADMIN', 'MEMBER'] as const)(
    '%s도 담당자 선택 없이 본인 일정 한 건을 등록한다',
    async (role) => {
      const source = createMockScheduleDataSource({ schedules: [], role });
      const create = jest.spyOn(source, 'create');
      await mount(<ScheduleEditorScreen source={source} initialDate="2026-09-15" />);
      expect(await screen.findByText('본인의 근무일정을 등록합니다.')).toBeOnTheScreen();
      await enterTime();
      await fireEvent.press(screen.getByLabelText('등록'));
      expect(await screen.findByText('근무 등록 완료!')).toBeOnTheScreen();
      expect(create).toHaveBeenCalledWith(101, {
        workDate: '2026-09-15',
        startTime: '09:00',
        endTime: '12:00',
      });
    },
  );
  it('날짜를 다시 선택하면 이전 날짜 대신 한 날짜만 전송한다', async () => {
    const source = createMockScheduleDataSource({ schedules: [] });
    const create = jest.spyOn(source, 'create');
    await mount(<ScheduleEditorScreen source={source} initialDate="2026-09-15" />);
    await fireEvent.press(await screen.findByLabelText('9월 16일 수, 근무 0건'));
    await enterTime();
    await fireEvent.press(screen.getByLabelText('등록'));
    expect(await screen.findByText('근무 등록 완료!')).toBeOnTheScreen();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(101, {
      workDate: '2026-09-16',
      startTime: '09:00',
      endTime: '12:00',
    });
  });
  it('다른 사람의 일정은 관리자라도 편집 화면을 열 수 없다', async () => {
    const source = createMockScheduleDataSource({
      role: 'ADMIN',
      userId: 1,
      schedules: [
        {
          id: 1,
          workspaceId: 101,
          employee: MOCK_STORE_MEMBERS[1],
          workDate: '2026-09-15',
          startTime: '09:00',
          endTime: '12:00',
          status: 'ACTIVE',
        },
      ],
    });
    await mount(<ScheduleEditorScreen source={source} scheduleId="1" />);
    expect(await screen.findByText('본인의 시작 전 근무만 수정할 수 있어요.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('출근 시간')).toBeNull();
  });
  it('일반 멤버는 본인 일정의 단일 날짜와 시간만 수정한다', async () => {
    const source = createMockScheduleDataSource({
      role: 'MEMBER',
      schedules: [
        {
          id: 1,
          workspaceId: 101,
          employee: MOCK_STORE_MEMBERS[0],
          workDate: '2026-09-15',
          startTime: '09:00',
          endTime: '12:00',
          status: 'ACTIVE',
        },
      ],
    });
    const update = jest.spyOn(source, 'update');
    await mount(<ScheduleEditorScreen source={source} scheduleId="1" />);
    await fireEvent.press(await screen.findByLabelText('다음'));
    await fireEvent.changeText(screen.getByLabelText('퇴근 시간'), '1300');
    await fireEvent.press(screen.getByLabelText('다음'));
    await fireEvent.press(screen.getByLabelText('수정 완료'));
    expect(await screen.findByText('근무 수정 완료!')).toBeOnTheScreen();
    expect(update).toHaveBeenCalledWith(101, 1, {
      workDate: '2026-09-15',
      startTime: '09:00',
      endTime: '13:00',
    });
  });
});
