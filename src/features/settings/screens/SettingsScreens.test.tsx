import 'react-native-gesture-handler/jestSetup';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainContextProvider, type MainContext } from '@/features/stores/hooks/useMainContext';
import * as storeApi from '@/features/stores/api/store.api';
import * as accountApi from '@/features/auth/api/account.api';
import { DepartureScreen } from '@/features/settings/screens/DepartureScreen';
import { InvitationsScreen } from '@/features/settings/screens/InvitationsScreen';
import { TransferAdminScreen } from '@/features/settings/screens/TransferAdminScreen';
import { EditNameDialog } from '@/features/settings/components/EditNameDialog';
import { AppError } from '@/shared/api/errors';

jest.mock('@expo/ui/community/bottom-sheet', () =>
  jest.requireActual('@/shared/ui/__mocks__/expoBottomSheet'),
);
jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('@/features/stores/api/store.api');
jest.mock('@/features/auth/api/account.api');
jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: (value: { signOut: () => Promise<void> }) => unknown) =>
    selector({ signOut: jest.fn<() => Promise<void>>().mockResolvedValue(undefined) }),
}));
jest.mock('@/shared/lib/logger', () => ({
  registerLogUserReader: jest.fn(),
  logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() },
}));
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: mockReplace, canGoBack: () => false },
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

const context: MainContext = {
  profile: {
    id: 1,
    displayName: '관리자',
    email: 'manager@example.com',
    profileImage: { source: 'STATIC', key: 'DEFAULT_MANAGER' },
  },
  membership: {
    store: {
      id: 10,
      storeName: '바톤',
      branchName: '강남점',
      address: '서울',
      storeContact: '02-1234-5678',
      status: 'ACTIVE',
      createdAt: '2026-09-01T00:00:00Z',
    },
    role: 'MANAGER',
    status: 'ACTIVE',
  },
  storeId: 10,
  storeName: '바톤',
  userId: 1,
  canManage: true,
};
const member = {
  userId: 2,
  displayName: '이지원',
  email: 'worker@example.com',
  profileImage: { source: 'STATIC', key: 'DEFAULT_EMPLOYEE' },
  role: 'EMPLOYEE',
  status: 'ACTIVE',
} as const;
const clients: QueryClient[] = [];
async function mount(element: ReactElement, role: 'MANAGER' | 'EMPLOYEE' = 'MANAGER') {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  clients.push(client);
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 44, bottom: 34, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>
        <MainContextProvider
          value={{
            ...context,
            canManage: role === 'MANAGER',
            membership: { ...context.membership, role },
          }}
        >
          {element}
        </MainContextProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}
afterEach(async () => {
  await cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  jest.resetAllMocks();
});

it('동의 전에는 나가기를 요청하지 않고 실패하면 동의를 유지한다', async () => {
  jest
    .mocked(storeApi.fetchMyStore)
    .mockResolvedValue({ membership: { ...context.membership, role: 'EMPLOYEE' } });
  jest
    .mocked(storeApi.leaveStore)
    .mockRejectedValue(new AppError('network', '연결을 확인해주세요.'));
  await mount(<DepartureScreen kind="leave" />, 'EMPLOYEE');
  await fireEvent.press(screen.getByRole('button', { name: '매장 나가기' }));
  expect(storeApi.leaveStore).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('checkbox'));
  await fireEvent.press(screen.getByRole('button', { name: '매장 나가기' }));
  expect(await screen.findByText('연결을 확인해주세요.')).toBeOnTheScreen();
  expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe(true);
  expect(mockReplace).not.toHaveBeenCalled();
});
it('다른 직원이 있는 관리자는 나가기 대신 승계 화면으로 이동한다', async () => {
  jest.mocked(storeApi.fetchMembers).mockResolvedValue([member]);
  await mount(<DepartureScreen kind="leave" />);
  await fireEvent.press(await screen.findByRole('button', { name: '관리자 권한 승계하기' }));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/settings/transfer-admin',
    params: { purpose: 'leave' },
  });
  expect(storeApi.deactivateStore).not.toHaveBeenCalled();
});
it('유효 코드 재발급은 확인 후에만 요청하며 취소하면 기존 코드를 유지한다', async () => {
  const current = {
    code: '0123',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    status: 'ACTIVE',
  } as const;
  jest.mocked(storeApi.fetchInvitationCode).mockResolvedValue(current);
  jest.mocked(storeApi.issueInvitationCode).mockResolvedValue({ ...current, code: '4567' });
  await mount(<InvitationsScreen />);
  expect(await screen.findByText('0123')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: '새 코드 생성' }));
  expect(await screen.findByText('새 초대 코드를 생성할까요?')).toBeOnTheScreen();
  expect(storeApi.issueInvitationCode).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: '취소' }));
  expect(screen.getByText('0123')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: '새 코드 생성' }));
  jest.mocked(storeApi.fetchInvitationCode).mockResolvedValue({ ...current, code: '4567' });
  await fireEvent.press(screen.getByRole('button', { name: '새 초대 코드 생성' }));
  expect(await screen.findByText('4567')).toBeOnTheScreen();
  expect(storeApi.issueInvitationCode).toHaveBeenCalledWith(10);
});
it('만료된 코드는 복사할 수 없고 새로 발급한다', async () => {
  jest
    .mocked(storeApi.fetchInvitationCode)
    .mockResolvedValue({ code: '0123', expiresAt: '2020-01-01T00:00:00Z', status: 'ACTIVE' });
  await mount(<InvitationsScreen />);
  await screen.findByRole('button', { name: '새 코드 생성' });
  expect(screen.queryByRole('button', { name: '코드 복사' })).toBeNull();
});
it('이름을 비워 저장하면 API를 호출하지 않고 오류를 표시한다', async () => {
  await mount(<EditNameDialog displayName="관리자" onClose={jest.fn()} onSaved={jest.fn()} />);
  await fireEvent.changeText(screen.getByLabelText('이름'), '');
  await fireEvent.press(screen.getByRole('button', { name: '저장' }));
  expect(await screen.findByText('이름을 입력해주세요.')).toBeOnTheScreen();
  expect(accountApi.updateDisplayName).not.toHaveBeenCalled();
});
it('승계 대상을 선택하고 확인해야 요청하며 실패하면 대상과 확인 화면을 유지한다', async () => {
  jest.mocked(storeApi.fetchMembers).mockResolvedValue([member]);
  jest
    .mocked(storeApi.transferManager)
    .mockRejectedValue(new AppError('network', '승계를 완료하지 못했어요.'));
  await mount(<TransferAdminScreen purpose="leave" />);
  await fireEvent.press(await screen.findByRole('radio', { name: '이지원, worker@example.com' }));
  await fireEvent.press(screen.getByRole('button', { name: '다음' }));
  expect(storeApi.transferManager).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: '승계하기' }));
  await waitFor(() => expect(storeApi.transferManager).toHaveBeenCalledWith(10, 2));
  expect(await screen.findByText('승계를 완료하지 못했어요.')).toBeOnTheScreen();
  expect(screen.getByText('이지원 님에게\n관리자 권한을 승계할까요?')).toBeOnTheScreen();
});
