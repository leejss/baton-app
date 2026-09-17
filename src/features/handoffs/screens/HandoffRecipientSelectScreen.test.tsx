import { afterEach, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { HandoffRecipientSelectScreen } from '@/features/handoffs/screens/HandoffRecipientSelectScreen';
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

async function renderRecipients(recommendation: unknown) {
  const fetch = jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const path = new URL(String(input)).pathname;
    const data = path.endsWith('/recipient-recommendation')
      ? recommendation
      : path.endsWith('/members')
        ? MOCK_MEMBERS
        : undefined;
    if (data === undefined) throw new Error(`예상하지 않은 요청: ${path}`);
    return new Response(
      JSON.stringify({ meta: { result: 'SUCCESS', errorCode: null, message: null }, data }),
    );
  });
  const client = createTestClient();
  clients.push(client);
  const onConfirm = jest.fn();
  await render(
    <MainTestProvider client={client}>
      <HandoffRecipientSelectScreen onBack={jest.fn()} onConfirm={onConfirm} />
    </MainTestProvider>,
  );
  await screen.findByText(morning.displayName);
  return { fetch, onConfirm };
}

it('API 후보별 근무시간을 표시하고 유일한 다음 근무자를 자동 선택한다', async () => {
  const { fetch, onConfirm } = await renderRecipients({
    recommended: MOCK_MEMBERS[1],
    recommendedStartAt: morning.startAt,
    candidates: [morning, evening],
  });

  expect(fetch).toHaveBeenCalledWith(
    'https://api.example.com/api/v1/stores/101/handovers/recipient-recommendation',
    expect.objectContaining({ method: 'GET' }),
  );
  expect(screen.getByRole('radio', { name: '이서연, 9. 18. 10:00' })).toBeSelected();
  expect(screen.getByRole('radio', { name: '박현우, 9. 18. 17:00' })).not.toBeSelected();
  expect(screen.getAllByText('다음 근무자')).toHaveLength(1);
  await fireEvent.press(screen.getByRole('button', { name: '확인' }));
  expect(useHandoffDraftStore.getState().recipient).toMatchObject({
    member: { userId: morning.userId },
    isRecommended: true,
    nextShiftLabel: '9. 18. 10:00',
  });
  expect(onConfirm).toHaveBeenCalledTimes(1);

  await fireEvent.press(screen.getByRole('radio', { name: '박현우, 9. 18. 17:00' }));
  await fireEvent.press(screen.getByRole('button', { name: '확인' }));
  expect(useHandoffDraftStore.getState().recipient).toMatchObject({
    member: { userId: evening.userId },
    isRecommended: false,
    nextShiftLabel: '9. 18. 17:00',
  });
});

it('동시 시작 후보는 시간만 표시하고 사용자가 직접 선택한다', async () => {
  await renderRecipients({
    candidates: [morning, { ...evening, startAt: morning.startAt }],
  });

  expect(screen.queryByText('다음 근무자')).not.toBeOnTheScreen();
  expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('radio', { name: '박현우, 9. 18. 10:00' }));
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
