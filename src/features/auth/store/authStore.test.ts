import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { z } from 'zod';

import type { Session } from '@/features/auth/api/auth.schema';
import { useAuthStore } from '@/features/auth/store/authStore';
import { get } from '@/shared/api/client';
import { secureStorage } from '@/shared/lib/secureStorage';

jest.mock('@/shared/config/api', () => ({
  API_URL: 'https://api.example.com/api/v1',
  assertApiConfigured: jest.fn(),
}));
jest.mock('@/shared/lib/logger', () => ({
  logger: { warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/shared/lib/deviceId', () => ({ getDeviceId: jest.fn() }));
jest.mock('@/features/auth/lib/kakaoAuth', () => ({
  signOutFromKakao: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.mock('@/shared/lib/secureStorage', () => ({
  secureStorage: {
    remove: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  },
}));

const session: Session = {
  user: {
    id: 1,
    email: 'test@example.com',
    displayName: '테스트',
    profileImage: { source: 'STATIC', key: 'DEFAULT_01' },
  },
  tokens: {
    accessToken: 'expired-access-token',
    refreshToken: 'expired-refresh-token',
    accessTokenExpiresAt: '2026-09-01T00:00:00Z',
    refreshTokenExpiresAt: '2026-09-02T00:00:00Z',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ status: 'signedIn', session, signOutReason: null });
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('동시 요청과 토큰 갱신이 401이면 대기를 끝내고 로컬 세션을 정리한다', async () => {
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => new Response(null, { status: 401 }));

  const results = await Promise.allSettled([
    get('/users/me', z.unknown()),
    get('/stores/me', z.unknown()),
  ]);

  expect(results).toEqual([
    { status: 'rejected', reason: expect.objectContaining({ status: 401 }) },
    { status: 'rejected', reason: expect.objectContaining({ status: 401 }) },
  ]);
  expect(useAuthStore.getState()).toMatchObject({
    status: 'signedOut',
    session: null,
    signOutReason: 'sessionRevoked',
  });
  expect(secureStorage.remove).toHaveBeenCalledWith('auth.session');
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    'https://api.example.com/api/v1/users/me',
    'https://api.example.com/api/v1/stores/me',
    'https://api.example.com/api/v1/auth/token/refresh',
  ]);
}, 1000);

it('사용자가 직접 로그아웃하면 서버 세션도 폐기한다', async () => {
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(null, { status: 204 }));

  await useAuthStore.getState().signOut();

  expect(fetchMock).toHaveBeenCalledWith(
    'https://api.example.com/api/v1/auth/logout',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer expired-access-token' }),
    }),
  );
  expect(useAuthStore.getState()).toMatchObject({
    status: 'signedOut',
    session: null,
    signOutReason: null,
  });
});

it('회원탈퇴 이후에는 이미 폐기된 서버 세션을 다시 요청하지 않는다', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  await useAuthStore.getState().signOut('withdrawn');
  expect(fetchMock).not.toHaveBeenCalled();
  expect(secureStorage.remove).toHaveBeenCalledWith('auth.session');
  expect(useAuthStore.getState()).toMatchObject({
    status: 'signedOut',
    session: null,
    signOutReason: 'withdrawn',
  });
});

it('로그아웃 요청이 401이면 서버 세션이 이미 끊긴 것이므로 로그아웃을 완료한다', async () => {
  // 로그아웃 401 → 토큰 갱신도 401 → 세션 만료 처리까지 모두 거친 뒤에도 사용자 로그아웃으로 끝나야 한다.
  jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => new Response(null, { status: 401 }));

  await expect(useAuthStore.getState().signOut()).resolves.toBeUndefined();

  expect(secureStorage.remove).toHaveBeenCalledWith('auth.session');
  expect(useAuthStore.getState()).toMatchObject({
    status: 'signedOut',
    session: null,
    // 사용자가 직접 누른 로그아웃이라 "다른 기기 로그인" 안내를 띄우지 않는다.
    signOutReason: null,
  });
});

it('로그아웃 요청이 실패하면 재시도할 수 있도록 세션을 유지한다', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 503 }));
  await expect(useAuthStore.getState().signOut()).rejects.toMatchObject({ status: 503 });
  expect(secureStorage.remove).not.toHaveBeenCalled();
  expect(useAuthStore.getState()).toMatchObject({
    status: 'signedIn',
    session,
    signOutReason: null,
  });
});
