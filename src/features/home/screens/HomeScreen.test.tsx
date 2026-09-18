import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { cleanup, render, screen, fireEvent } from '@testing-library/react-native';
import * as homeApi from '@/features/home/api/home.api';
import * as notifications from '@/features/notifications/api/notification.api';
import * as handoffs from '@/features/handoffs/api/handoff.api';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { MainTestProvider, createTestClient } from '@/test/MainTestProvider';
import { INITIAL_MOCK_HANDOFFS, MOCK_MEMBERS } from '@/test/fixtures/handoffs';
const mockNavigate = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, push: mockPush }),
}));
let client = createTestClient();
beforeEach(() => {
  client = createTestClient();
  jest
    .spyOn(notifications, 'fetchNotifications')
    .mockResolvedValue({ items: [], unreadCount: 0, badgeText: '' });
});
afterEach(async () => {
  await cleanup();
  client.clear();
  jest.restoreAllMocks();
  mockNavigate.mockReset();
  mockPush.mockReset();
});

it('홈에서 날짜를 바꾼 뒤 인수인계를 누르면 선택한 근무 날짜를 전달한다', async () => {
  jest.spyOn(homeApi, 'fetchHome').mockImplementation(async (_storeId, date) => ({
    date,
    schedulePreview: [
      {
        id: 177,
        employee: MOCK_MEMBERS[1],
        workDate: date,
        startTime: '15:00',
        endTime: '18:00',
        status: 'ACTIVE',
      },
    ],
    receivedHandoverCount: 0,
    receivedHandovers: [],
  }));
  await render(
    <MainTestProvider client={client}>
      <HomeScreen initialDate="2026-09-21" />
    </MainTestProvider>,
  );
  await fireEvent.press(await screen.findByRole('button', { name: '9월 27일 일요일' }));
  await fireEvent.press(await screen.findByLabelText('이서연님에게 인수인계 작성'));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/handoffs/new',
    params: { recipientId: '2', workDate: '2026-09-27' },
  });
});
it('빈 인수인계와 빈 근무일을 정상 상태로 표시한다', async () => {
  jest.spyOn(homeApi, 'fetchHome').mockResolvedValue({
    date: '2026-09-11',
    schedulePreview: [],
    receivedHandoverCount: 0,
    receivedHandovers: [],
  });
  await render(
    <MainTestProvider client={client}>
      <HomeScreen initialDate="2026-09-11" />
    </MainTestProvider>,
  );
  expect(await screen.findByText('전달받은 인수인계가 없어요')).toBeOnTheScreen();
  expect(await screen.findByText('해당 날짜에 등록된 근무 일정이 없습니다.')).toBeOnTheScreen();
});
it('서버 조회 실패를 빈 인수인계로 표시하지 않는다', async () => {
  jest.spyOn(homeApi, 'fetchHome').mockRejectedValue(new Error('홈 조회 실패'));
  await render(
    <MainTestProvider client={client}>
      <HomeScreen initialDate="2026-09-11" />
    </MainTestProvider>,
  );
  expect((await screen.findAllByText('홈 조회 실패')).length).toBeGreaterThan(0);
  expect(screen.queryByText('전달받은 인수인계가 없어요')).toBeNull();
});
it('홈 조회만으로 인수인계를 확인 처리하지 않는다', async () => {
  const confirm = jest.spyOn(handoffs, 'confirmHandoff');
  jest.spyOn(homeApi, 'fetchHome').mockResolvedValue({
    date: '2026-09-11',
    schedulePreview: [],
    receivedHandoverCount: 1,
    receivedHandovers: [INITIAL_MOCK_HANDOFFS[1]],
  });
  await render(
    <MainTestProvider client={client}>
      <HomeScreen initialDate="2026-09-11" />
    </MainTestProvider>,
  );
  expect(await screen.findByText(INITIAL_MOCK_HANDOFFS[1].title)).toBeOnTheScreen();
  expect(confirm).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText('전체 인수인계 자세히 보기'));
  expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/handoffs', params: { scope: 'all' } });
});
