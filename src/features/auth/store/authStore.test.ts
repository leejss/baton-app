import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { z } from 'zod';

import type { Session } from '@/features/auth/api/auth.schema';
import { useAuthStore } from '@/features/auth/store/authStore';
import { get } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { secureStorage } from '@/shared/lib/secureStorage';

jest.mock('@/shared/config/api', () => ({
  API_URL: 'https://api.example.com/api/v1',
  assertApiConfigured: jest.fn(),
}));
jest.mock('@/shared/lib/logger', () => ({
  registerLogUserReader: jest.fn(),
  logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn(), error: jest.fn() },
}));
jest.mock('@/shared/lib/deviceId', () => ({ getDeviceId: jest.fn() }));
jest.mock('@/features/auth/lib/kakaoAuth', () => ({
  signOutFromKakao: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.mock('@/shared/lib/secureStorage', () => ({
  secureStorage: {
    get: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
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
  jest.mocked(secureStorage.get).mockResolvedValue(null);
  jest.mocked(secureStorage.remove).mockResolvedValue(undefined);
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

it('사용자가 직접 로그아웃하면 푸시 토큰을 먼저 비활성화하고 서버 세션을 폐기한다', async () => {
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(null, { status: 204 }));

  await useAuthStore.getState().signOut();
  expect(logger.info).toHaveBeenCalledTimes(1);
  expect(logger.info).toHaveBeenCalledWith('로그아웃 완료');
  expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
    ['https://api.example.com/api/v1/push-tokens/current', 'DELETE'],
    ['https://api.example.com/api/v1/auth/logout', 'POST'],
  ]);

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
  expect(logger.info).not.toHaveBeenCalled();
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
  expect(logger.info).not.toHaveBeenCalled();
  expect(secureStorage.remove).not.toHaveBeenCalled();
  expect(useAuthStore.getState()).toMatchObject({
    status: 'signedIn',
    session,
    signOutReason: null,
  });
});

describe('앱 시작 시 세션 복원', () => {
  beforeEach(() => {
    useAuthStore.setState({ status: 'restoring', session: null, signOutReason: null });
  });

  it('저장된 세션이 없으면 로그인 화면으로 진행한다', async () => {
    await useAuthStore.getState().restore();

    expect(useAuthStore.getState()).toMatchObject({ status: 'signedOut', session: null });
    expect(secureStorage.remove).not.toHaveBeenCalled();
  });

  it('유효한 세션은 복원하고 삭제하지 않는다', async () => {
    jest.mocked(secureStorage.get).mockResolvedValue(JSON.stringify(session));

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState()).toMatchObject({ status: 'signedIn', session });
    expect(secureStorage.remove).not.toHaveBeenCalled();
  });

  it.each(['{broken-json', JSON.stringify({ user: { id: 1 } })])(
    '손상되거나 스키마가 다른 세션은 폐기하고 로그인 화면으로 진행한다: %s',
    async (raw) => {
      jest.mocked(secureStorage.get).mockResolvedValue(raw);

      await expect(useAuthStore.getState().restore()).resolves.toBeUndefined();

      expect(useAuthStore.getState()).toMatchObject({ status: 'signedOut', session: null });
      expect(secureStorage.remove).toHaveBeenCalledWith('auth.session');
      expect(logger.warn).toHaveBeenCalledWith('저장된 세션을 복원하지 못해 로그아웃했습니다');
    },
  );

  it('저장소 읽기가 실패해도 복원을 마치고 로그인 화면으로 진행한다', async () => {
    jest.mocked(secureStorage.get).mockRejectedValue(new Error('keychain unavailable'));

    await expect(useAuthStore.getState().restore()).resolves.toBeUndefined();

    expect(useAuthStore.getState()).toMatchObject({ status: 'signedOut', session: null });
  });

  it('손상된 세션 삭제가 실패해도 restoring에 머물지 않는다', async () => {
    jest.mocked(secureStorage.get).mockResolvedValue('{broken-json');
    const failure = new Error('keychain unavailable');
    jest.mocked(secureStorage.remove).mockRejectedValue(failure);

    await expect(useAuthStore.getState().restore()).resolves.toBeUndefined();

    expect(useAuthStore.getState()).toMatchObject({ status: 'signedOut', session: null });
    expect(logger.warn).toHaveBeenCalledWith('복원할 수 없는 세션 정리 실패', failure);
  });
});
