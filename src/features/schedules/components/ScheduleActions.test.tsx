import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMockScheduleDataSource } from '@/features/schedules/api/mockScheduleDataSource';
import { monthlyScheduleSchema } from '@/features/schedules/api/schedule.schema';
import { ScheduleActions } from '@/features/schedules/components/ScheduleActions';
import { MOCK_STORE_MEMBERS } from '@/shared/api/mockMembers';

jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
const clients: QueryClient[] = [];
const now = new Date('2026-09-07T00:00:00Z');
const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, right: 0, bottom: 34, left: 0 },
};
const item = {
  id: 12,
  employee: MOCK_STORE_MEMBERS[1],
  workDate: '2026-09-15',
  startTime: '09:00',
  endTime: '12:00',
  status: 'ACTIVE' as const,
};
async function mount(source: ReturnType<typeof createMockScheduleDataSource>, onClose = jest.fn()) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  clients.push(client);
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={client}>
        <ScheduleActions source={source} id={12} now={now} onClose={onClose} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}
afterEach(async () => {
  await cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  jest.restoreAllMocks();
});

describe('근무 삭제', () => {
  it('삭제 확인 전에는 유지하고 확인 이후 삭제 결과를 월간 조회에 반영한다', async () => {
    const source = createMockScheduleDataSource({ now: () => now, schedules: [item] });
    const remove = jest.spyOn(source, 'remove');
    const onClose = jest.fn();
    await mount(source, onClose);
    await fireEvent.press(await screen.findByLabelText('삭제'));
    expect(remove).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('삭제 확인'));
    expect(await screen.findByText('근무 삭제 완료!')).toBeOnTheScreen();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(monthlyScheduleSchema.parse(await source.month(101, '2026-09')).schedules).toHaveLength(
      0,
    );
    await fireEvent.press(screen.getByLabelText('확인'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('삭제 실패 시 선택한 일정과 확인·취소 동작을 유지한다', async () => {
    const source = createMockScheduleDataSource({ now: () => now, schedules: [item] });
    jest.spyOn(source, 'remove').mockRejectedValueOnce(new Error('연결을 확인해주세요.'));
    await mount(source);
    await fireEvent.press(await screen.findByLabelText('삭제'));
    await fireEvent.press(screen.getByLabelText('삭제 확인'));
    expect(await screen.findByText('연결을 확인해주세요.')).toBeOnTheScreen();
    expect(screen.getByLabelText('취소')).toBeEnabled();
    await fireEvent.press(screen.getByLabelText('삭제 확인'));
    expect(await screen.findByText('근무 삭제 완료!')).toBeOnTheScreen();
  });
});
