import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AppError, isAppError, type AppErrorCode } from '@/shared/api/errors';

const mockLogin = jest.fn<() => Promise<{ accessToken?: string }>>();
const mockLogout = jest.fn<() => Promise<void>>();

jest.mock('@react-native-seoul/kakao-login', () => ({
  login: mockLogin,
  logout: mockLogout,
}));

/**
 * static import로 올리면 mock 팩토리가 `mockLogin` 초기화 전에 실행돼 TDZ 에러가 난다.
 * `logger.test.ts`와 같은 방식으로 필요한 시점에 실제 모듈을 가져온다.
 */
function loadKakaoAuth(): typeof import('@/features/auth/lib/kakaoAuth') {
  return jest.requireActual<typeof import('@/features/auth/lib/kakaoAuth')>(
    '@/features/auth/lib/kakaoAuth',
  );
}

/** 던져진 값이 AppError인지까지 확인하고 code를 꺼낸다. */
async function codeOfRejection(run: () => Promise<unknown>): Promise<AppErrorCode> {
  try {
    await run();
  } catch (error) {
    if (isAppError(error)) {
      return error.code;
    }
    throw new Error(`AppError가 아닌 값이 던져졌습니다: ${String(error)}`);
  }
  throw new Error('실패할 것으로 기대했지만 성공했습니다');
}

describe('kakaoAuth', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockLogout.mockReset();
  });

  it('액세스 토큰을 그대로 돌려준다', async () => {
    mockLogin.mockResolvedValue({ accessToken: 'kakao-token' });

    await expect(loadKakaoAuth().signInWithKakao()).resolves.toBe('kakao-token');
  });

  it('사용자가 취소하면 canceled 로 구분한다 — 에러 UI를 띄우면 안 되는 유일한 경우다', async () => {
    mockLogin.mockRejectedValue(
      Object.assign(new Error('user cancelled'), { code: 'E_CANCELLED_OPERATION' }),
    );

    await expect(codeOfRejection(loadKakaoAuth().signInWithKakao)).resolves.toBe('canceled');
  });

  it('취소가 아닌 실패는 canceled 로 잘못 분류하지 않는다', async () => {
    mockLogin.mockRejectedValue(new Error('네트워크 끊김'));

    await expect(codeOfRejection(loadKakaoAuth().signInWithKakao)).resolves.toBe('unknown');
  });

  it('토큰이 비어 오면 실패로 처리한다', async () => {
    mockLogin.mockResolvedValue({ accessToken: '' });

    await expect(codeOfRejection(loadKakaoAuth().signInWithKakao)).resolves.toBe('unknown');
  });

  it('로그아웃 실패는 흐름을 막지 않는다 — 우리 세션 정리는 계속돼야 한다', async () => {
    mockLogout.mockRejectedValue(new AppError('network', '카카오 서버에 닿지 못했어요'));

    await expect(loadKakaoAuth().signOutFromKakao()).resolves.toBeUndefined();
  });
});
