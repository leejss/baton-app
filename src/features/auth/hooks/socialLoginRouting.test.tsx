import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Apple from 'expo-apple-authentication';
import * as ExpoLinking from 'expo-linking';
import { ExpoRoot, Stack, usePathname } from 'expo-router';
import { getMockContext } from 'expo-router/testing-library';
import { Alert, Linking, Text } from 'react-native';

import AuthLayout from '@/app/(auth)/_layout';
import LoginRoute from '@/app/(auth)/login';
import StartRoute from '@/app/(auth)/start';
import MainLayout from '@/app/(main)/_layout';
import StoreOnboardingLayout from '@/app/(store-onboarding)/_layout';
import * as nativeIntent from '@/app/+native-intent';
import IndexRoute from '@/app/index';
import type { Session } from '@/features/auth/api/auth.schema';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSignupStore } from '@/features/auth/store/signupStore';
import * as queryClient from '@/shared/api/queryClient';
import { logger } from '@/shared/lib/logger';
import { ROUTES } from '@/shared/lib/routes';
import { secureStorage } from '@/shared/lib/secureStorage';
import { SessionQueryProvider } from '@/shared/providers/SessionQueryProvider';
import { createTestClient, TEST_CONTEXT } from '@/test/MainTestProvider';

const mockKakaoLogin = jest.fn<() => Promise<{ accessToken: string }>>();

jest.mock('@react-native-seoul/kakao-login', () => ({
  login: () => mockKakaoLogin(),
  logout: jest.fn(),
}));
jest.mock('expo-apple-authentication', () => ({
  ...jest.requireActual<typeof import('expo-apple-authentication')>('expo-apple-authentication'),
  isAvailableAsync: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
  signInAsync: jest.fn(),
}));
jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn<() => Promise<{ isConnected: boolean }>>().mockResolvedValue({
    isConnected: true,
  }),
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
}));
jest.mock('@/shared/config/api', () => ({
  API_URL: 'https://api.example.com/api/v1',
  assertApiConfigured: jest.fn(),
}));
jest.mock('@/shared/lib/deviceId', () => ({
  getDeviceId: jest.fn<() => Promise<string>>().mockResolvedValue('test-device'),
}));
jest.mock('@/shared/lib/logger', () => ({
  registerLogUserReader: jest.fn(),
  logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() },
}));
jest.mock('@/shared/lib/secureStorage', () => ({
  secureStorage: {
    set: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    get: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
    remove: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  },
}));

const urlListeners = new Set<Parameters<typeof ExpoLinking.addEventListener>[1]>();

async function emitUrl(url: string) {
  expect(urlListeners.size).toBeGreaterThan(0);
  for (const listener of [...urlListeners]) await listener({ url });
}

const KAKAO_CALLBACK = 'kakao0123456789abcdef0123456789abcdef://oauth?code=test-code';
const session: Session = {
  user: TEST_CONTEXT.profile,
  membership: {
    ...TEST_CONTEXT.membership,
    store: { ...TEST_CONTEXT.membership.store, createdAt: '2026-09-01T00:00:00Z' },
  },
  tokens: {
    accessToken: 'baton-access-token',
    refreshToken: 'baton-refresh-token',
    accessTokenExpiresAt: '2026-10-01T00:00:00Z',
    refreshTokenExpiresAt: '2026-11-01T00:00:00Z',
  },
};
const signupRequired = {
  status: 'SIGNUP_REQUIRED',
  socialSignupToken: 'test-signup-token',
  expiresAt: '2026-10-01T00:00:00Z',
  suggestedEmail: null,
  suggestedDisplayName: null,
};

function TestRootLayout() {
  const pathname = usePathname();
  return (
    <SessionQueryProvider>
      <Text>현재 경로: {pathname}</Text>
      <Stack screenOptions={{ headerShown: false }} />
    </SessionQueryProvider>
  );
}

const context = getMockContext({
  _layout: TestRootLayout,
  index: IndexRoute,
  '+native-intent': nativeIntent,
  '+not-found': () => <Text>페이지를 찾을 수 없어요</Text>,
  '(auth)/_layout': AuthLayout,
  '(auth)/start': StartRoute,
  '(auth)/login': LoginRoute,
  '(auth)/signup/name': () => <Text>가입 이름 입력</Text>,
  '(main)/_layout': MainLayout,
  '(main)/(tabs)/home': () => <Text>홈 화면</Text>,
  '(main)/notifications': () => <Text>알림 화면</Text>,
  '(store-onboarding)/_layout': StoreOnboardingLayout,
  '(store-onboarding)/store': () => <Text>매장 시작 화면</Text>,
});

function successfulResponse(data: unknown) {
  return new Response(
    JSON.stringify({ meta: { result: 'SUCCESS', errorCode: null, message: null }, data }),
    { status: 200 },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  urlListeners.clear();
  jest.spyOn(queryClient, 'createQueryClient').mockImplementation(() => {
    const client = createTestClient();
    client.setDefaultOptions({
      ...client.getDefaultOptions(),
      mutations: { retry: false, gcTime: Infinity },
    });
    return client;
  });
  useAuthStore.setState({ status: 'signedOut', session: null, signOutReason: null });
  useSignupStore.getState().clear();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  // SDK 경계에서 발생하는 URL 이벤트를 실제 Expo Router 구독자에게 전달한다.
  jest.spyOn(ExpoLinking, 'addEventListener').mockImplementation((type, listener) => {
    const subscription = Linking.addEventListener(type, listener);
    const remove = subscription.remove.bind(subscription);
    urlListeners.add(listener);
    return Object.assign(subscription, {
      remove: () => {
        urlListeners.delete(listener);
        remove();
      },
    });
  });
  mockKakaoLogin.mockResolvedValue({ accessToken: 'test-kakao-token' });
  jest.mocked(Apple.signInAsync).mockResolvedValue({
    user: 'test-apple-user',
    state: null,
    identityToken: 'test-apple-token',
    authorizationCode: 'test-apple-code',
    email: null,
    fullName: null,
    realUserStatus: Apple.AppleAuthenticationUserDetectionStatus.UNKNOWN,
  });
});

afterEach(async () => {
  await cleanup();
  jest.restoreAllMocks();
});

describe.each([ROUTES.auth.start, ROUTES.auth.login])('%s에서 소셜 로그인', (entryPath) => {
  describe.each(['kakao', 'apple'] as const)('%s', (provider) => {
    async function pressLogin() {
      await render(<ExpoRoot context={context} location={entryPath} />);
      const button = await screen.findByRole('button', {
        name: provider === 'kakao' ? '카카오로 시작하기' : 'Apple로 시작하기',
      });
      await fireEvent.press(button);
    }

    function mockServer(outcome: unknown, hasStore = true) {
      return jest.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (String(url).endsWith(`/auth/social/${provider}`)) return successfulResponse(outcome);
        if (String(url).endsWith('/users/me')) return successfulResponse(session.user);
        if (String(url).endsWith('/stores/me'))
          return successfulResponse({ membership: hasStore ? session.membership : null });
        throw new Error(`예상하지 않은 요청: ${url}`);
      });
    }

    it.each([true, false])('기존 계정은 매장 소속 여부(%s)에 맞게 이동한다', async (hasStore) => {
      const fetchMock = mockServer({ status: 'LOGGED_IN', ...session }, hasStore);
      await pressLogin();

      const destination = hasStore ? ROUTES.home : ROUTES.store;
      await waitFor(() => expect(screen.getByText(`현재 경로: ${destination}`)).toBeOnTheScreen());
      expect(useAuthStore.getState().status).toBe('signedIn');
      const [storageKey, storedSession] = jest.mocked(secureStorage.set).mock.calls[0];
      expect(storageKey).toBe('auth.session');
      expect(JSON.parse(storedSession)).toEqual(session);
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.example.com/api/v1/auth/social/${provider}`,
        expect.objectContaining({
          body: JSON.stringify(
            provider === 'kakao'
              ? { accessToken: 'test-kakao-token', deviceId: 'test-device' }
              : {
                  identityToken: 'test-apple-token',
                  authorizationCode: 'test-apple-code',
                  deviceId: 'test-device',
                },
          ),
        }),
      );
      expect(screen.queryByText('페이지를 찾을 수 없어요')).toBeNull();
    });

    it('신규 계정은 제공자와 가입 토큰을 유지하며 가입 화면으로 이동한다', async () => {
      mockServer(signupRequired);
      await pressLogin();

      await waitFor(() =>
        expect(screen.getByText(`현재 경로: ${ROUTES.signup.name}`)).toBeOnTheScreen(),
      );
      expect(useSignupStore.getState()).toMatchObject({
        mode: 'social',
        provider,
        socialSignupToken: signupRequired.socialSignupToken,
      });
      expect(useAuthStore.getState().status).toBe('signedOut');
      expect(secureStorage.set).not.toHaveBeenCalled();
    });

    it('SDK 인증 취소 시 원래 화면을 유지한다', async () => {
      const failure = {
        code: provider === 'kakao' ? 'E_CANCELLED_OPERATION' : 'ERR_REQUEST_CANCELED',
      };
      if (provider === 'kakao') mockKakaoLogin.mockRejectedValue(failure);
      else jest.mocked(Apple.signInAsync).mockRejectedValue(failure);
      const fetchMock = jest.spyOn(globalThis, 'fetch');
      await pressLogin();

      await waitFor(() => expect(logger.error).toHaveBeenCalled());
      expect(screen.getByText(`현재 경로: ${entryPath}`)).toBeOnTheScreen();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('서버 인증 실패 시 오류를 표시하고 원래 화면을 유지한다', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));
      await pressLogin();

      await waitFor(() =>
        expect(Alert.alert).toHaveBeenCalledWith('로그인하지 못했어요', expect.any(String)),
      );
      expect(screen.getByText(`현재 경로: ${entryPath}`)).toBeOnTheScreen();
      expect(useAuthStore.getState().status).toBe('signedOut');
    });
  });

  it.each(['LOGGED_IN', 'SIGNUP_REQUIRED'])(
    '카카오 콜백 후 서버 결과(%s)에 따라 이동한다',
    async (status) => {
      let resolveSdk: (token: { accessToken: string }) => void = () => {};
      mockKakaoLogin.mockReturnValue(
        new Promise((resolve) => {
          resolveSdk = resolve;
        }),
      );
      jest.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (String(url).endsWith('/auth/social/kakao'))
          return successfulResponse(
            status === 'LOGGED_IN' ? { status, ...session } : signupRequired,
          );
        if (String(url).endsWith('/users/me')) return successfulResponse(session.user);
        if (String(url).endsWith('/stores/me'))
          return successfulResponse({ membership: session.membership });
        throw new Error(`예상하지 않은 요청: ${url}`);
      });
      await render(<ExpoRoot context={context} location={entryPath} />);
      await fireEvent.press(await screen.findByRole('button', { name: '카카오로 시작하기' }));
      await act(async () => {
        await emitUrl(KAKAO_CALLBACK);
      });

      expect(screen.getByText(`현재 경로: ${entryPath}`)).toBeOnTheScreen();
      expect(screen.queryByText('페이지를 찾을 수 없어요')).toBeNull();
      await act(async () => {
        resolveSdk({ accessToken: 'test-kakao-token' });
      });
      const destination = status === 'LOGGED_IN' ? ROUTES.home : ROUTES.signup.name;
      await waitFor(() => expect(screen.getByText(`현재 경로: ${destination}`)).toBeOnTheScreen());
      // 늦거나 중복된 SDK 콜백도 이동을 되돌리지 않는다.
      await act(async () => {
        await emitUrl(KAKAO_CALLBACK);
      });
      expect(screen.getByText(`현재 경로: ${destination}`)).toBeOnTheScreen();
    },
  );
});

it('일반 앱 딥링크는 정상적으로 화면을 이동한다', async () => {
  await render(<ExpoRoot context={context} location={ROUTES.auth.start} />);
  await act(async () => {
    await emitUrl('baton-dev://login');
  });
  await waitFor(() =>
    expect(screen.getByText(`현재 경로: ${ROUTES.auth.login}`)).toBeOnTheScreen(),
  );
});

it.each(['signedOut', 'signedIn'] as const)(
  '카카오 콜백으로 앱이 처음 열려도 세션 상태(%s)에 맞게 진입한다',
  async (status) => {
    if (status === 'signedIn') {
      useAuthStore.setState({ status, session });
      jest.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (String(url).endsWith('/users/me')) return successfulResponse(session.user);
        if (String(url).endsWith('/stores/me'))
          return successfulResponse({ membership: session.membership });
        throw new Error(`예상하지 않은 요청: ${url}`);
      });
    }
    jest.spyOn(ExpoLinking, 'getLinkingURL').mockReturnValue(KAKAO_CALLBACK);
    await render(<ExpoRoot context={context} />);

    const destination = status === 'signedIn' ? ROUTES.home : ROUTES.auth.start;
    await waitFor(() => expect(screen.getByText(`현재 경로: ${destination}`)).toBeOnTheScreen());
    expect(screen.queryByText('페이지를 찾을 수 없어요')).toBeNull();
  },
);
