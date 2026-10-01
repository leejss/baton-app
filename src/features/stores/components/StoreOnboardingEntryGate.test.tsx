import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useIsFocused } from 'expo-router';
import { Text } from 'react-native';

import { fetchMyStore, leaveStore } from '@/features/stores/api/store.api';
import { StoreOnboardingEntryGate } from '@/features/stores/components/StoreOnboardingEntryGate';
import { AppError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/lib/routes';
import { createTestClient, MainTestProvider, TEST_CONTEXT } from '@/test/MainTestProvider';

jest.mock('expo-router', () => {
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    useIsFocused: jest.fn(() => true),
    Redirect: ({ href }: { href: string }) => <MockText>이동: {href}</MockText>,
  };
});
jest.mock('@/features/stores/api/store.api', () => ({
  fetchMyStore: jest.fn(),
  leaveStore: jest.fn(),
}));
jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (state: { status: string }) => unknown) => selector({ status: 'signedIn' }),
    { getState: () => ({ session: { user: { id: 1 } } }) },
  ),
}));
jest.mock('@/shared/lib/logger', () => ({ logger: { warn: jest.fn() } }));

let client = createTestClient();
const inactiveMembership = {
  ...TEST_CONTEXT.membership,
  store: { ...TEST_CONTEXT.membership.store, status: 'INACTIVE' as const },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useIsFocused).mockReturnValue(true);
  client = createTestClient();
  jest.mocked(fetchMyStore).mockResolvedValue({ membership: null });
  jest.mocked(leaveStore).mockResolvedValue(undefined);
});
afterEach(async () => {
  await cleanup();
  client.clear();
});

async function renderGate() {
  await render(
    <MainTestProvider client={client}>
      <StoreOnboardingEntryGate>
        <Text>매장 생성 선택</Text>
      </StoreOnboardingEntryGate>
    </MainTestProvider>,
  );
}

it('활성 소속이 있으면 새 생성 화면 대신 기존 매장으로 이동한다', async () => {
  jest.mocked(fetchMyStore).mockResolvedValue({ membership: TEST_CONTEXT.membership });
  await renderGate();
  expect(await screen.findByText(`이동: ${ROUTES.home}`)).toBeOnTheScreen();
  expect(screen.queryByText('매장 생성 선택')).toBeNull();
  expect(leaveStore).not.toHaveBeenCalled();
});

it('소속이 없음을 확인한 뒤 선택 화면을 연다', async () => {
  await renderGate();
  expect(await screen.findByText('매장 생성 선택')).toBeOnTheScreen();
});

it('비활성 매장 소속 정리가 끝날 때까지 생성을 막는다', async () => {
  let resolveLeave: () => void = () => {};
  jest.mocked(fetchMyStore).mockResolvedValue({ membership: inactiveMembership });
  jest.mocked(leaveStore).mockReturnValue(
    new Promise((resolve) => {
      resolveLeave = resolve;
    }),
  );
  await renderGate();
  await waitFor(() => expect(leaveStore).toHaveBeenCalledWith(TEST_CONTEXT.storeId));
  expect(screen.queryByText('매장 생성 선택')).toBeNull();
  await act(async () => {
    resolveLeave();
  });
  expect(await screen.findByText('매장 생성 선택')).toBeOnTheScreen();
  expect(leaveStore).toHaveBeenCalledTimes(1);
});

it('소속 정리 실패는 자동 반복하지 않고 사용자 재시도로 복구한다', async () => {
  jest.mocked(fetchMyStore).mockResolvedValue({ membership: inactiveMembership });
  jest
    .mocked(leaveStore)
    .mockRejectedValueOnce(new AppError('server', '정리 실패', { status: 503 }));
  await renderGate();
  expect(await screen.findByText('정리 실패')).toBeOnTheScreen();
  expect(leaveStore).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));
  expect(await screen.findByText('매장 생성 선택')).toBeOnTheScreen();
  expect(leaveStore).toHaveBeenCalledTimes(2);
});

it('소속 조회 실패도 선택 화면을 열지 않고 조회를 재시도한다', async () => {
  jest.mocked(fetchMyStore).mockRejectedValueOnce(new AppError('network', '연결 실패'));
  await renderGate();
  expect(await screen.findByText('연결 실패')).toBeOnTheScreen();
  expect(screen.queryByText('매장 생성 선택')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));
  expect(await screen.findByText('매장 생성 선택')).toBeOnTheScreen();
});

it('뒤에 남은 진입 화면은 소속 조회나 이동으로 완료 화면을 가로채지 않는다', async () => {
  jest.mocked(useIsFocused).mockReturnValue(false);
  await renderGate();
  expect(screen.getByText('매장 생성 선택')).toBeOnTheScreen();
  expect(fetchMyStore).not.toHaveBeenCalled();
});
