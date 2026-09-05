import { create } from 'zustand';

/**
 * 비밀번호 재설정 플로우가 4개 화면에 걸쳐 들고 다니는 값.
 *
 * 라우터 search params 대신 store를 쓰는 이유:
 *   - `verifyToken`은 화면 주소에 노출되면 안 되는 단기 인증 토큰이다.
 *   - 이메일도 주소창·딥링크 기록에 남길 이유가 없다.
 *
 * **저장소에 persist 하지 않는다.** 재설정은 한 번에 끝내는 흐름이라 앱을 다시 켰을 때
 * 중간 단계가 되살아나면 오히려 이상하고, 인증 토큰이 디스크에 남는 것도 피한다.
 */
type PasswordResetState = {
  email: string | null;
  /** 인증코드 만료 시각(epoch ms). 카운트다운의 기준. */
  expiresAt: number | null;
  /** 재발송이 가능해지는 시각(epoch ms). */
  resendableAt: number | null;
  /** 인증 완료 후 서버가 준 단기 토큰. 새 비밀번호 제출에 함께 보낸다. */
  verifyToken: string | null;
};

type PasswordResetActions = {
  /** 인증코드를 보냈다. 이메일이 바뀌면 이전 인증 결과는 무효다. */
  startChallenge: (params: { email: string; expiresAt: string; resendableAt: string }) => void;
  /** 재발송. 이메일은 그대로 두고 만료·재발송 시각만 새로 받는다. */
  refreshChallenge: (params: { expiresAt: string; resendableAt: string }) => void;
  completeVerification: (verifyToken: string) => void;
  clear: () => void;
};

export type PasswordResetStore = PasswordResetState & PasswordResetActions;

const EMPTY: PasswordResetState = {
  email: null,
  expiresAt: null,
  resendableAt: null,
  verifyToken: null,
};

export const usePasswordResetStore = create<PasswordResetStore>()((set) => ({
  ...EMPTY,

  startChallenge: ({ email, expiresAt, resendableAt }) =>
    set({
      email,
      expiresAt: Date.parse(expiresAt),
      resendableAt: Date.parse(resendableAt),
      // 이메일이 바뀌었을 수 있으므로 이전 인증 결과를 반드시 버린다.
      verifyToken: null,
    }),

  refreshChallenge: ({ expiresAt, resendableAt }) =>
    set({
      expiresAt: Date.parse(expiresAt),
      resendableAt: Date.parse(resendableAt),
      verifyToken: null,
    }),

  completeVerification: (verifyToken) => set({ verifyToken }),

  clear: () => set(EMPTY),
}));
