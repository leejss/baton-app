import { create } from 'zustand';

import { logger } from '@/shared/lib/logger';
import { secureStorage } from '@/shared/lib/secureStorage';

import { sessionSchema, type Session } from '@/features/auth/api/auth.schema';
import { signOutFromKakao } from '@/features/auth/lib/kakaoAuth';

/**
 * 로그인 세션. 서버에서 온 데이터지만 TanStack Query가 아니라 여기 둔다 —
 * 화면에 그리는 데이터가 아니라 **앱 전체의 모드를 가르는 클라이언트 상태**이기 때문이다.
 * 사용자 프로필처럼 화면에 그리는 서버 데이터는 Query로 따로 가져온다.
 *
 * 토큰은 mmkv가 아니라 expo-secure-store(키체인/키스토어)에 넣는다.
 */
const SESSION_KEY = 'auth.session';

type AuthSnapshot =
  | { status: 'restoring'; session: null }
  | { status: 'signedOut'; session: null }
  | { status: 'signedIn'; session: Session };

type AuthActions = {
  /** 앱 시작 시 1회. 끝나기 전에는 로그인 화면을 그리지 않아야 깜빡임이 없다. */
  restore: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
};

export type AuthStore = AuthSnapshot & AuthActions;

export const useAuthStore = create<AuthStore>()((set) => ({
  status: 'restoring',
  session: null,

  restore: async () => {
    const raw = await secureStorage.get(SESSION_KEY);
    if (raw === null) {
      set({ status: 'signedOut', session: null });
      return;
    }

    // 저장된 값도 검증한다. 스키마가 바뀐 채 남아 있던 값이면 버리고 로그아웃 상태로 간다.
    const parsed = sessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      logger.warn('저장된 세션 형식이 맞지 않아 폐기했습니다');
      await secureStorage.remove(SESSION_KEY);
      set({ status: 'signedOut', session: null });
      return;
    }

    set({ status: 'signedIn', session: parsed.data });
  },

  signIn: async (session) => {
    await secureStorage.set(SESSION_KEY, JSON.stringify(session));
    set({ status: 'signedIn', session });
  },

  signOut: async () => {
    await signOutFromKakao();
    await secureStorage.remove(SESSION_KEY);
    set({ status: 'signedOut', session: null });
  },
}));
