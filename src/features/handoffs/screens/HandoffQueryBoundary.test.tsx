import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import * as api from '@/features/handoffs/api/handoff.api';
import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { HandoffDetailScreen } from '@/features/handoffs/screens/HandoffDetailScreen';
import { HandoffEditScreen } from '@/features/handoffs/screens/HandoffEditScreen';
import { HandoffRecipientSelectScreen } from '@/features/handoffs/screens/HandoffRecipientSelectScreen';
import { useHandoffDraftStore } from '@/features/handoffs/store/handoffDraftStore';
import { AppError } from '@/shared/api/errors';
import { createTestClient, MainTestProvider } from '@/test/MainTestProvider';
import { INITIAL_MOCK_HANDOFFS, MOCK_MEMBERS } from '@/test/fixtures/handoffs';

jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));

const handoff = INITIAL_MOCK_HANDOFFS[0];
const recipients = MOCK_MEMBERS.filter((member) => member.userId !== 1).map((member) => ({
  member,
  isRecommended: false,
}));
const clients: ReturnType<typeof createTestClient>[] = [];
const cases = [
  { name: '상세', content: handoff.title },
  { name: '수정', content: '전달할 내용을 수정해 주세요' },
  { name: '수신자 선택', content: recipients[0].member.displayName },
] as const;

function renderScreen(name: (typeof cases)[number]['name']) {
  const client = createTestClient();
  client.setDefaultOptions({
    ...client.getDefaultOptions(),
    mutations: { retry: false, gcTime: Infinity },
  });
  clients.push(client);
  const onBack = jest.fn();
  const onHome = jest.fn();
  const onConfirm = jest.fn();
  const onSaved = jest.fn();
  const content =
    name === '상세' ? (
      <HandoffDetailScreen
        handoffId={String(handoff.id)}
        onBack={onBack}
        onHome={onHome}
        onDeleted={jest.fn()}
        onEdit={jest.fn()}
      />
    ) : name === '수정' ? (
      <HandoffEditScreen handoffId={String(handoff.id)} onBack={onBack} onSaved={onSaved} />
    ) : (
      <HandoffRecipientSelectScreen onBack={onBack} onConfirm={onConfirm} />
    );
  return {
    onBack,
    onHome,
    onConfirm,
    onSaved,
    rendered: render(<MainTestProvider client={client}>{content}</MainTestProvider>),
  };
}

function mockRecipients(queryFn: () => Promise<typeof recipients>) {
  const options = handoffQueries.recipients(101, 1);
  jest.spyOn(handoffQueries, 'recipients').mockReturnValue({ ...options, queryFn });
}

afterEach(async () => {
  await cleanup();
  await act(async () => {
    for (const client of clients) client.clear();
  });
  clients.length = 0;
  useHandoffDraftStore.getState().reset();
  jest.restoreAllMocks();
});

describe('인수인계 로컬 쿼리 경계', () => {
  it.each(cases)(
    '$name: 로딩 중에도 헤더의 뒤로가기를 사용할 수 있다',
    async ({ name, content }) => {
      jest.spyOn(api, 'fetchHandoff').mockImplementation(() => new Promise<never>(() => {}));
      mockRecipients(() => new Promise<never>(() => {}));

      const result = renderScreen(name);
      await result.rendered;

      expect(screen.queryByText(content)).not.toBeOnTheScreen();
      await fireEvent.press(screen.getByLabelText('뒤로 가기'));
      expect(result.onBack).toHaveBeenCalledTimes(1);
      if (name === '상세') {
        await fireEvent.press(screen.getByLabelText('홈으로 이동'));
        expect(result.onHome).toHaveBeenCalledTimes(1);
        expect(screen.queryByLabelText('인수인계 수정 및 삭제 메뉴')).not.toBeOnTheScreen();
      }
    },
  );

  it.each(cases)(
    '$name: 조회 실패 시 헤더를 유지하고 본문만 재시도한다',
    async ({ name, content }) => {
      const error = new AppError('network', '테스트 연결 오류');
      jest.spyOn(api, 'fetchHandoff').mockRejectedValueOnce(error).mockResolvedValue(handoff);
      let attempts = 0;
      mockRecipients(async () => {
        if (name === '수신자 선택' && attempts++ === 0) throw error;
        return recipients;
      });

      const result = renderScreen(name);
      await result.rendered;

      expect(await screen.findByText('테스트 연결 오류')).toBeOnTheScreen();
      await fireEvent.press(screen.getByLabelText('뒤로 가기'));
      expect(result.onBack).toHaveBeenCalledTimes(1);
      await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));
      expect(await screen.findByText(content)).toBeOnTheScreen();
      expect(screen.getByLabelText('뒤로 가기')).toBeOnTheScreen();
    },
  );

  it('수정: 헤더에서 나갈 때 미저장 확인을 유지하고 저장 중에는 이탈을 막는다', async () => {
    jest.spyOn(api, 'fetchHandoff').mockResolvedValue(handoff);
    mockRecipients(async () => recipients);
    const alert = jest.spyOn(Alert, 'alert');
    let finishSave: ((value: typeof handoff) => void) | undefined;
    jest.spyOn(api, 'updateHandoff').mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
    const result = renderScreen('수정');
    await result.rendered;
    const titleInput = await screen.findByLabelText('인수인계 제목');
    await fireEvent.changeText(titleInput, '변경한 제목');
    await fireEvent.press(screen.getByLabelText('뒤로 가기'));
    expect(alert).toHaveBeenCalledWith('수정을 그만할까요?', expect.any(String), expect.any(Array));
    expect(result.onBack).not.toHaveBeenCalled();

    alert.mockClear();
    await fireEvent.press(screen.getByRole('button', { name: '저장' }));
    await fireEvent.press(screen.getByLabelText('뒤로 가기'));
    expect(result.onBack).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
    expect(api.updateHandoff).toHaveBeenCalledTimes(1);
    await act(async () => {
      finishSave?.(handoff);
    });
    expect(result.onSaved).toHaveBeenCalledTimes(1);
  });

  it('수신자 선택: 로딩 후 선택한 직원을 확인하면 초안에 반영한다', async () => {
    mockRecipients(async () => recipients);
    const result = renderScreen('수신자 선택');
    await result.rendered;
    const recipient = recipients[0];
    await fireEvent.press(
      await screen.findByRole('radio', {
        name: `${recipient.member.displayName}, 근무 시간 미정`,
      }),
    );
    await fireEvent.press(screen.getByRole('button', { name: '확인' }));
    expect(useHandoffDraftStore.getState().recipient?.member.userId).toBe(recipient.member.userId);
    expect(result.onConfirm).toHaveBeenCalledTimes(1);
  });
});
