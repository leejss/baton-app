import { afterEach, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { HandoffRecipientSelectScreen } from '@/features/handoffs/screens/HandoffRecipientSelectScreen';
import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { useHandoffDraftStore } from '@/features/handoffs/store/handoffDraftStore';
import { createTestClient, MainTestProvider } from '@/test/MainTestProvider';
import { MOCK_MEMBERS } from '@/test/fixtures/handoffs';

jest.mock('@/shared/config/api', () => ({
  API_URL: 'https://api.example.com/api/v1',
  assertApiConfigured: jest.fn(),
}));

const clients: ReturnType<typeof createTestClient>[] = [];
const morning = { ...MOCK_MEMBERS[1], startAt: '2026-09-18T10:00:00+09:00' };
const evening = { ...MOCK_MEMBERS[2], startAt: '2026-09-18T08:00:00Z' };

afterEach(async () => {
  await cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  useHandoffDraftStore.getState().reset();
  jest.restoreAllMocks();
});

async function renderRecipients(recommendation: unknown, workDate?: string) {
  const fetch = jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const path = new URL(String(input)).pathname;
    if (!path.endsWith('/recipient-recommendation')) {
      throw new Error(`예상하지 않은 요청: ${path}`);
    }
    return new Response(
      JSON.stringify({
        meta: { result: 'SUCCESS', errorCode: null, message: null },
        data: recommendation,
      }),
    );
  });
  const client = createTestClient();
  // 다른 날짜와 일반 작성의 캐시가 있어도 선택한 날짜를 새로 조회해야 한다.
  if (workDate) {
    client.setQueryData(handoffQueries.recipients(101, 1).queryKey, []);
    client.setQueryData(handoffQueries.recipients(101, 1, '2026-09-18').queryKey, []);
  }
  clients.push(client);
  const onConfirm = jest.fn();
  await render(
    <MainTestProvider client={client}>
      <HandoffRecipientSelectScreen workDate={workDate} onBack={jest.fn()} onConfirm={onConfirm} />
    </MainTestProvider>,
  );
  await screen.findByRole('button', { name: '확인' });
  return { fetch, onConfirm };
}

it('추천 API만 조회해 후보별 근무시간을 표시하고 유일한 다음 근무자를 자동 선택한다', async () => {
  const { fetch, onConfirm } = await renderRecipients({
    recommended: MOCK_MEMBERS[1],
    recommendedStartAt: morning.startAt,
    candidates: [morning, evening],
  });

  expect(fetch).toHaveBeenCalledWith(
    'https://api.example.com/api/v1/stores/101/handovers/recipient-recommendation',
    expect.objectContaining({ method: 'GET' }),
  );
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(screen.getAllByRole('radio')).toHaveLength(2);
  expect(screen.queryByText(MOCK_MEMBERS[3].displayName)).not.toBeOnTheScreen();
  expect(screen.getByRole('radio', { name: '이서연, 금요일 10:00 - 미정' })).toBeSelected();
  expect(screen.getByRole('radio', { name: '박현우, 금요일 17:00 - 미정' })).not.toBeSelected();
  expect(screen.getAllByText('다음 근무자')).toHaveLength(1);
  await fireEvent.press(screen.getByRole('button', { name: '확인' }));
  expect(useHandoffDraftStore.getState().recipient).toMatchObject({
    member: { userId: morning.userId },
    isRecommended: true,
    nextShiftLabel: '금요일 10:00 - 미정',
  });
  expect(onConfirm).toHaveBeenCalledTimes(1);

  await fireEvent.press(screen.getByRole('radio', { name: '박현우, 금요일 17:00 - 미정' }));
  await fireEvent.press(screen.getByRole('button', { name: '확인' }));
  expect(useHandoffDraftStore.getState().recipient).toMatchObject({
    member: { userId: evening.userId },
    isRecommended: false,
    nextShiftLabel: '금요일 17:00 - 미정',
  });
});

it('27일 근무에서 진입하면 다른 날짜의 캐시 대신 27일 시간을 조회하고 선택한다', async () => {
  const candidate = { ...MOCK_MEMBERS[1], startAt: '2026-09-27T06:00:00Z' };
  const { fetch } = await renderRecipients(
    { recommended: MOCK_MEMBERS[1], candidates: [candidate] },
    '2026-09-27',
  );

  expect(fetch).toHaveBeenCalledTimes(1);
  const requestUrl = new URL(String(fetch.mock.calls[0][0]));
  expect(requestUrl.searchParams.get('referenceAt')).toBe('2026-09-27T00:00:00+09:00');
  expect(screen.getByRole('radio', { name: '이서연, 일요일 15:00 - 미정' })).toBeSelected();
  expect(screen.queryByText('근무 시간 미정')).not.toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: '확인' }));
  expect(useHandoffDraftStore.getState().recipient?.nextShiftLabel).toBe('일요일 15:00 - 미정');
});

it('동시 시작 후보는 시간만 표시하고 사용자가 직접 선택한다', async () => {
  await renderRecipients({
    candidates: [morning, { ...evening, startAt: morning.startAt }],
  });

  expect(screen.queryByText('다음 근무자')).not.toBeOnTheScreen();
  expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('radio', { name: '박현우, 금요일 10:00 - 미정' }));
  await fireEvent.press(screen.getByRole('button', { name: '확인' }));
  expect(useHandoffDraftStore.getState().recipient?.member.userId).toBe(evening.userId);
});

it('근무가 없는 후보의 null 또는 생략된 시작 시각은 미정으로 표시한다', async () => {
  await renderRecipients({
    recommended: null,
    recommendedStartAt: null,
    candidates: [{ ...MOCK_MEMBERS[1], startAt: null }, MOCK_MEMBERS[2]],
  });

  expect(screen.getByRole('radio', { name: '이서연, 근무 시간 미정' })).toBeOnTheScreen();
  expect(screen.getByRole('radio', { name: '박현우, 근무 시간 미정' })).toBeOnTheScreen();
  expect(screen.queryByText('다음 근무자')).not.toBeOnTheScreen();
  expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
});

it('추천 API의 후보가 없으면 빈 목록을 표시하고 확인을 비활성화한다', async () => {
  const { fetch } = await renderRecipients({ candidates: [] });

  expect(fetch).toHaveBeenCalledTimes(1);
  expect(screen.getByText('선택할 수 있는 직원이 없어요')).toBeOnTheScreen();
  expect(screen.queryAllByRole('radio')).toHaveLength(0);
  expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
});
