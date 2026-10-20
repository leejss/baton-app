import { throwIfAborted } from '@/shared/api/abort';
import { create } from 'zustand';

import { registerAuthBridge, type RefreshedTokens } from '@/shared/api/client';
import { isAppError } from '@/shared/api/errors';
import { logger, registerLogUserReader } from '@/shared/lib/logger';
import { secureStorage } from '@/shared/lib/secureStorage';

import { signOutFromServer } from '@/features/auth/api/auth.api';
import { sessionSchema, type Session } from '@/features/auth/api/auth.schema';
import { signOutFromKakao } from '@/features/auth/lib/kakaoAuth';
import { disableCurrentPushToken } from '@/features/notifications/api/push.api';
import {
  forgetPushRegistration,
  pausePushRegistration,
  resumePushRegistration,
} from '@/features/notifications/lib/pushRegistration';

const SESSION_KEY = 'auth.session';
// 취소된 저장 정리가 뒤따르는 로그인 세션을 지우지 않도록 쓰기를 직렬화한다.
let signInWrite: Promise<void> = Promise.resolve();

// 갱신 실패와 다른 기기 로그인은 서버 응답으로 구분할 수 없어 같은 사유로 안내한다.
type SignOutReason = 'sessionRevoked' | 'withdrawn';

type AuthSnapshot =
  | { status: 'restoring'; session: null }
  | { status: 'signedOut'; session: null }
  | { status: 'signedIn'; session: Session };

type AuthActions = {
  restore: () => Promise<void>;
  signIn: (session: Session, signal?: AbortSignal) => Promise<void>;
  signOut: (reason?: SignOutReason) => Promise<void>;
  clearSignOutReason: () => void;
  applyTokens: (tokens: RefreshedTokens) => Promise<void>;
};

type AuthStore = AuthSnapshot & {
  signOutReason: SignOutReason | null;
} & AuthActions;

export const useAuthStore = create<AuthStore>()((set, get) => ({
  status: 'restoring',
  session: null,
  signOutReason: null,

  restore: async () => {
    try {
      const raw = await secureStorage.get(SESSION_KEY);
      if (raw === null) {
        set({ status: 'signedOut', session: null });
        return;
      }

      const parsed = sessionSchema.safeParse(JSON.parse(raw));
      if (parsed.success) {
        set({ status: 'signedIn', session: parsed.data });
        return;
      }
    } catch {
      // JSON 파싱 오류에는 저장된 값이 포함될 수 있으므로 원문과 오류를 로깅하지 않는다.
    }

    logger.warn('저장된 세션을 복원하지 못해 로그아웃했습니다');
    try {
      await secureStorage.remove(SESSION_KEY);
    } catch (error) {
      logger.warn('복원할 수 없는 세션 정리 실패', error);
    } finally {
      // 저장소 정리까지 실패해도 restoring에 머물며 스플래시를 계속 띄우지 않는다.
      set({ status: 'signedOut', session: null });
    }
  },

  signIn: (session, signal) => {
    const write = signInWrite.then(async () => {
      if (signal) throwIfAborted(signal);
      await secureStorage.set(SESSION_KEY, JSON.stringify(session));
      if (signal?.aborted) {
        await secureStorage.remove(SESSION_KEY);
        throwIfAborted(signal);
      }
      set({ status: 'signedIn', session, signOutReason: null });
    });
    signInWrite = write.catch(() => {});
    return write;
  },

  signOut: async (reason) => {
    // 갱신 실패로 들어온 경우 서버 로그아웃의 401이 같은 갱신 작업을 기다리면
    // 서로 완료를 기다리게 된다. 이미 거부된 세션은 기기에서만 정리한다.
    if (reason === undefined) {
      await pausePushRegistration();
      try {
        await disableCurrentPushToken();
        await signOutFromServer();
      } catch (error) {
        // 401은 서버에서 세션이 이미 끊겼다는 뜻이라 로그아웃의 목적은 이뤄졌다. 기기 정리를 이어간다.
        // 그 밖의 실패(네트워크 등)는 서버 세션이 살아 있을 수 있어 호출부에 알린다.
        if (!(isAppError(error) && error.status === 401)) {
          resumePushRegistration();
          throw error;
        }
      }
    } else {
      // 등록 요청 자체의 401로 들어오기도 한다. 여기서는 진행 중인 요청을 기다리지 않는다.
      forgetPushRegistration();
    }
    await signOutFromKakao();
    await secureStorage.remove(SESSION_KEY);
    set({ status: 'signedOut', session: null, signOutReason: reason ?? null });
    if (reason === undefined) logger.info('로그아웃 완료');
  },

  clearSignOutReason: () => set({ signOutReason: null }),

  applyTokens: async (tokens) => {
    const { session } = get();
    if (session === null) {
      return;
    }

    const next = { ...session, tokens };
    await secureStorage.set(SESSION_KEY, JSON.stringify(next));
    set({ status: 'signedIn', session: next });
  },
}));

registerAuthBridge({
  getAccessToken: () => useAuthStore.getState().session?.tokens.accessToken ?? null,
  getRefreshToken: () => useAuthStore.getState().session?.tokens.refreshToken ?? null,
  onTokensRefreshed: (tokens) => useAuthStore.getState().applyTokens(tokens),
  onSessionExpired: async () => {
    // Refresh Token까지 죽었으면 되살릴 방법이 없다. 조용히 로그아웃 상태로 되돌린다.
    await useAuthStore.getState().signOut('sessionRevoked');
  },
});

registerLogUserReader(() => useAuthStore.getState().session?.user ?? null);
