import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { Session } from '@/features/auth/api/auth.schema';

const mockGet = jest.fn<(key: string) => Promise<string | null>>();
const mockSet = jest.fn<(key: string, value: string) => Promise<void>>();
const mockRemove = jest.fn<(key: string) => Promise<void>>();
const mockKakaoLogout = jest.fn<() => Promise<void>>();

jest.mock('@/shared/lib/secureStorage', () => ({
  secureStorage: { get: mockGet, set: mockSet, remove: mockRemove },
}));

jest.mock('@/features/auth/lib/kakaoAuth', () => ({
  signOutFromKakao: mockKakaoLogout,
}));

const SESSION: Session = {
  accessToken: 'our-access-token',
  refreshToken: 'our-refresh-token',
  expiresAt: '2026-12-31T00:00:00.000Z',
  user: { id: 'u1', nickname: '김지원', profileImageUrl: null },
};

/** 스토어는 모듈 전역 상태라 테스트마다 새로 불러온다. */
function loadStore(): typeof import('@/features/auth/store/authStore') {
  return jest.requireActual<typeof import('@/features/auth/store/authStore')>(
    '@/features/auth/store/authStore',
  );
}

describe('authStore', () => {
  beforeEach(() => {
    jest.resetModules();
    mockGet.mockReset();
    mockSet.mockReset().mockResolvedValue(undefined);
    mockRemove.mockReset().mockResolvedValue(undefined);
    mockKakaoLogout.mockReset().mockResolvedValue(undefined);
  });

  it('저장된 세션이 없으면 signedOut 으로 끝난다', async () => {
    mockGet.mockResolvedValue(null);
    const { useAuthStore } = loadStore();

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('저장된 세션을 복원한다', async () => {
    mockGet.mockResolvedValue(JSON.stringify(SESSION));
    const { useAuthStore } = loadStore();

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('signedIn');
    expect(useAuthStore.getState().session?.user.nickname).toBe('김지원');
  });

  it('형식이 깨진 세션은 폐기하고 로그아웃 상태로 간다 — 스키마가 바뀐 채 남은 값이 앱을 망가뜨리면 안 된다', async () => {
    mockGet.mockResolvedValue(JSON.stringify({ accessToken: 'only-this' }));
    const { useAuthStore } = loadStore();

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(mockRemove).toHaveBeenCalledWith('auth.session');
  });

  it('로그인하면 세션을 보안 저장소에 넣는다', async () => {
    const { useAuthStore } = loadStore();

    await useAuthStore.getState().signIn(SESSION);

    expect(mockSet).toHaveBeenCalledWith('auth.session', JSON.stringify(SESSION));
    expect(useAuthStore.getState().status).toBe('signedIn');
  });

  it('로그아웃하면 카카오 세션도 끊고 저장된 세션을 지운다', async () => {
    const { useAuthStore } = loadStore();
    await useAuthStore.getState().signIn(SESSION);

    await useAuthStore.getState().signOut();

    expect(mockKakaoLogout).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenCalledWith('auth.session');
    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(useAuthStore.getState().session).toBeNull();
  });
});
