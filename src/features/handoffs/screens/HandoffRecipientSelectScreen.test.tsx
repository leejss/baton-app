import { afterEach, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import * as members from '@/features/stores/api/store.api';
import { HandoffRecipientSelectScreen } from '@/features/handoffs/screens/HandoffRecipientSelectScreen';
import { useHandoffDraftStore } from '@/features/handoffs/store/handoffDraftStore';
import { createTestClient, MainTestProvider } from '@/test/MainTestProvider';
import { MOCK_MEMBERS } from '@/test/fixtures/handoffs';
let client = createTestClient();
afterEach(async () => {
  await cleanup();
  client.clear();
  useHandoffDraftStore.getState().reset();
  jest.restoreAllMocks();
});
it('멤버 목록을 직접 조회하고 자동 선택 없이 한 명을 선택한다', async () => {
  client = createTestClient();
  const fetch = jest.spyOn(members, 'fetchMembers').mockResolvedValue(MOCK_MEMBERS);
  const confirm = jest.fn();
  await render(
    <MainTestProvider client={client}>
      <HandoffRecipientSelectScreen onBack={jest.fn()} onConfirm={confirm} />
    </MainTestProvider>,
  );
  const candidate = MOCK_MEMBERS[1];
  const radio = await screen.findByRole('radio', {
    name: `${candidate.displayName}, ${candidate.email}`,
  });
  expect(fetch).toHaveBeenCalledWith(101, expect.any(AbortSignal));
  expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
  await fireEvent.changeText(
    screen.getByLabelText('담당자 이름 또는 이메일 검색'),
    candidate.displayName,
  );
  await fireEvent.press(radio);
  await fireEvent.press(screen.getByRole('button', { name: '확인' }));
  expect(useHandoffDraftStore.getState().recipient?.member.userId).toBe(candidate.userId);
  expect(confirm).toHaveBeenCalledTimes(1);
});
