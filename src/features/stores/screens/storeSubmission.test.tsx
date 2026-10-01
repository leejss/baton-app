import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { QueryObserver } from '@tanstack/react-query';

import { createStore, fetchMyStore, joinStore } from '@/features/stores/api/store.api';
import { storeQueries } from '@/features/stores/api/store.queries';
import type { StoreContext } from '@/features/stores/api/store.schema';
import { StoreCreateContactScreen } from '@/features/stores/screens/StoreCreateContactScreen';
import { StoreJoinConfirmScreen } from '@/features/stores/screens/StoreJoinConfirmScreen';
import { useStoreCreateStore } from '@/features/stores/store/storeCreateStore';
import { AppError } from '@/shared/api/errors';
import { createTestClient, MainTestProvider, TEST_CONTEXT } from '@/test/MainTestProvider';

jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);
jest.mock('@/features/stores/api/store.api', () => ({
  createStore: jest.fn(),
  joinStore: jest.fn(),
  fetchMyStore: jest.fn(),
}));
jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: { getState: () => ({ session: { user: { id: 1 } } }) },
}));
jest.mock('@/shared/lib/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

const context: StoreContext = {
  store: TEST_CONTEXT.membership.store,
  membership: TEST_CONTEXT.membership,
  initialInvitationCode: null,
  invitationCodeIssueStatus: 'ISSUE_FAILED',
};
let client = createTestClient();
const onCreated = jest.fn();
const onAlreadyJoined = jest.fn();
const onJoined = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  client = createTestClient();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  useStoreCreateStore.setState({
    storeName: '테스트 매장',
    branchName: '본점',
    address: '서울',
    detailAddress: '',
    storeContact: '02-1234-5678',
    createdContext: null,
  });
  jest.mocked(createStore).mockResolvedValue(context);
  jest.mocked(joinStore).mockResolvedValue(context);
  jest.mocked(fetchMyStore).mockResolvedValue({ membership: null });
});

afterEach(async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await cleanup();
  client.clear();
  jest.restoreAllMocks();
  useStoreCreateStore.getState().clear();
});

async function renderCreate() {
  await render(
    <MainTestProvider client={client}>
      <StoreCreateContactScreen
        onBack={jest.fn()}
        onCreated={onCreated}
        onAlreadyJoined={onAlreadyJoined}
      />
    </MainTestProvider>,
  );
  await waitFor(() => expect(screen.getByRole('button', { name: '다음' })).toBeEnabled());
}

it('폼 검증 전의 연속 키보드 제출도 한 번만 생성하고 코드 발급 실패 응답도 완료한다', async () => {
  await renderCreate();
  const input = screen.getByPlaceholderText('02-1234-5678');
  await act(async () => {
    input.props.onSubmitEditing();
    input.props.onSubmitEditing();
  });
  await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  expect(createStore).toHaveBeenCalledTimes(1);
  expect(onCreated).toHaveBeenCalledWith(context);
  expect(client.getQueryData(storeQueries.me().queryKey)).toEqual({
    membership: context.membership,
  });
  expect(fetchMyStore).not.toHaveBeenCalled();
});

it('소속 조회가 느려도 성공 응답으로 완료하며 다시 생성하지 않는다', async () => {
  let resolvePreviousQuery: (value: { membership: null }) => void = () => {};
  jest.mocked(fetchMyStore).mockReturnValue(
    new Promise((resolve) => {
      resolvePreviousQuery = resolve;
    }),
  );
  const observer = new QueryObserver(client, storeQueries.me());
  const unsubscribe = observer.subscribe(() => {});
  await renderCreate();
  await fireEvent.press(screen.getByRole('button', { name: '다음' }));
  await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  await fireEvent(screen.getByPlaceholderText('02-1234-5678'), 'submitEditing');
  expect(createStore).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolvePreviousQuery({ membership: null });
  });
  expect(client.getQueryData(storeQueries.me().queryKey)).toEqual({
    membership: context.membership,
  });
  unsubscribe();
});

it('실패한 생성 요청은 잠금을 풀어 다시 제출할 수 있다', async () => {
  jest.mocked(createStore).mockRejectedValueOnce(new AppError('server', '장애', { status: 503 }));
  await renderCreate();
  await fireEvent.press(screen.getByRole('button', { name: '다음' }));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByRole('button', { name: '다음' })).toBeEnabled());
  await fireEvent.press(screen.getByRole('button', { name: '다음' }));
  await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  expect(createStore).toHaveBeenCalledTimes(2);
});

it.each([
  [
    '소속 충돌',
    new AppError('server', '이미 소속됨', { status: 409, errorCode: 'STORE_ALREADY_JOINED' }),
  ],
  ['응답 누락', new AppError('timeout', '응답 누락')],
])('%s는 캐시가 아닌 최신 소속으로 복구한다', async (_label, failure) => {
  client.setQueryData(storeQueries.me().queryKey, { membership: null });
  jest.mocked(createStore).mockRejectedValue(failure);
  jest.mocked(fetchMyStore).mockResolvedValue({ membership: context.membership });
  await renderCreate();
  await fireEvent.press(screen.getByRole('button', { name: '다음' }));
  await waitFor(() => expect(onAlreadyJoined).toHaveBeenCalledTimes(1));
  expect(fetchMyStore).toHaveBeenCalledTimes(1);
  expect(onCreated).not.toHaveBeenCalled();
  expect(createStore).toHaveBeenCalledTimes(1);
});

it('소속 조회 실패 뒤 다시 확인하면 생성 요청을 반복하지 않는다', async () => {
  jest.mocked(createStore).mockRejectedValue(new AppError('timeout', '응답 누락'));
  jest.mocked(fetchMyStore).mockRejectedValueOnce(new AppError('network', '오프라인'));
  await renderCreate();
  await fireEvent.press(screen.getByRole('button', { name: '다음' }));
  await waitFor(() =>
    expect(Alert.alert).toHaveBeenCalledWith(
      '소속을 확인하지 못했어요',
      expect.any(String),
      expect.any(Array),
    ),
  );
  jest.mocked(fetchMyStore).mockResolvedValue({ membership: context.membership });
  await fireEvent.press(screen.getByRole('button', { name: '다음' }));
  await waitFor(() => expect(onAlreadyJoined).toHaveBeenCalledTimes(1));
  expect(createStore).toHaveBeenCalledTimes(1);
  expect(fetchMyStore).toHaveBeenCalledTimes(2);
});

it('입력 화면을 떠난 뒤 늦게 성공해도 완료 화면으로 다시 이동하지 않는다', async () => {
  let resolveRequest: (value: StoreContext) => void = () => {};
  jest.mocked(createStore).mockReturnValue(
    new Promise((resolve) => {
      resolveRequest = resolve;
    }),
  );
  await renderCreate();
  await fireEvent(screen.getByPlaceholderText('02-1234-5678'), 'submitEditing');
  await waitFor(() => expect(createStore).toHaveBeenCalledTimes(1));
  await screen.unmount();
  await act(async () => {
    resolveRequest(context);
  });
  expect(onCreated).not.toHaveBeenCalled();
});

it('매장 참여도 연속 제출에서 한 번만 참여하고 완료한다', async () => {
  await render(
    <MainTestProvider client={client}>
      <StoreJoinConfirmScreen
        storeName="테스트 매장"
        address="서울"
        storeContact="02-1234-5678"
        invitationCode="1234"
        onBack={jest.fn()}
        onJoined={onJoined}
        onInvitationExpired={jest.fn()}
        onAlreadyJoined={onAlreadyJoined}
      />
    </MainTestProvider>,
  );
  const button = screen.getByRole('button', { name: '다음' });
  await fireEvent.press(button);
  await fireEvent.press(button);
  await waitFor(() => expect(onJoined).toHaveBeenCalledTimes(1));
  expect(joinStore).toHaveBeenCalledTimes(1);
  expect(client.getQueryData(storeQueries.me().queryKey)).toEqual({
    membership: context.membership,
  });
});
