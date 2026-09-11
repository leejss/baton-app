import { create } from 'zustand';

import { registerAuthBridge, type RefreshedTokens } from '@/shared/api/client';
import { logger } from '@/shared/lib/logger';
import { secureStorage } from '@/shared/lib/secureStorage';

import { signOutFromServer } from '@/features/auth/api/auth.api';
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

/**
 * 세션이 사라진 이유. 사용자가 직접 로그아웃한 경우와 서버가 세션을 끊은 경우를
 * 화면이 다르게 안내해야 해서 구분한다.
 *
 * `sessionRevoked`는 Refresh Token까지 거부당한 경우다. 계약상 단말 1개 세션이라
 * (ADR-005) 대부분 **다른 기기에서 로그인**한 경우지만, Refresh Token이 자연 만료된
 * 경우와 응답만으로는 구분되지 않는다 — 갱신 실패는 둘 다 `401 UNAUTHORIZED`다.
 * 서버가 두 경우에 다른 `errorCode`를 주면 그때 갈라야 한다.
 */
export type SignOutReason = 'sessionRevoked';

type AuthSnapshot =
  | { status: 'restoring'; session: null }
  | { status: 'signedOut'; session: null }
  | { status: 'signedIn'; session: Session };

type AuthActions = {
  /** 앱 시작 시 1회. 끝나기 전에는 로그인 화면을 그리지 않아야 깜빡임이 없다. */
  restore: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  /** 사유를 주면 화면이 그에 맞는 안내를 띄운다. 사용자가 직접 누른 로그아웃은 생략한다. */
  signOut: (reason?: SignOutReason) => Promise<void>;
  /** 안내를 한 번 보여준 뒤 지운다. 남겨두면 다음 로그아웃 때 또 뜬다. */
  clearSignOutReason: () => void;
  /** 토큰만 교체한다. `client`가 401을 만나 갱신에 성공했을 때 호출한다. */
  applyTokens: (tokens: RefreshedTokens) => Promise<void>;
};

export type AuthStore = AuthSnapshot & { signOutReason: SignOutReason | null } & AuthActions;

export const useAuthStore = create<AuthStore>()((set, get) => ({
  status: 'restoring',
  session: null,
  signOutReason: null,

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
    // 새로 로그인했으면 이전 로그아웃 안내는 의미가 없다.
    set({ status: 'signedIn', session, signOutReason: null });
  },

  signOut: async (reason) => {
    // 갱신 실패로 들어온 경우 서버 로그아웃의 401이 같은 갱신 작업을 기다리면
    // 서로 완료를 기다리게 된다. 이미 거부된 세션은 기기에서만 정리한다.
    if (reason !== 'sessionRevoked') {
      await signOutFromServer();
    }
    await signOutFromKakao();
    await secureStorage.remove(SESSION_KEY);
    set({ status: 'signedOut', session: null, signOutReason: reason ?? null });
  },

  clearSignOutReason: () => set({ signOutReason: null }),

  applyTokens: async (tokens) => {
    const { session } = get();
    if (session === null) {
      return;
    }

    const next: Session = { ...session, tokens };
    await secureStorage.set(SESSION_KEY, JSON.stringify(next));
    set({ status: 'signedIn', session: next });
  },
}));

/**
 * 토큰 보관은 여기가, 주입은 `shared/api/client`가 한다. 서로 import 하면 순환이라
 * 스토어가 자기 자신을 등록하는 방향으로만 연결한다.
 *
 * 이 모듈이 로드되는 시점에 등록된다 — 루트 레이아웃이 앱 시작 시 `restore()`를
 * 부르므로 첫 요청보다 항상 먼저다.
 */
registerAuthBridge({
  getAccessToken: () => useAuthStore.getState().session?.tokens.accessToken ?? null,
  getRefreshToken: () => useAuthStore.getState().session?.tokens.refreshToken ?? null,
  onTokensRefreshed: (tokens) => useAuthStore.getState().applyTokens(tokens),
  onSessionExpired: async () => {
    // Refresh Token까지 죽었으면 되살릴 방법이 없다. 조용히 로그아웃 상태로 되돌린다.
    await useAuthStore.getState().signOut('sessionRevoked');
    logger.warn('세션이 만료되어 로그아웃했습니다');
  },
});
