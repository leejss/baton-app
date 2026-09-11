import { create } from 'zustand';

import type { Session } from '@/features/auth/api/auth.schema';
import {
  TERMS,
  type AgreementDecision,
  type SocialProvider,
  type TermsCode,
} from '@/features/auth/api/signup.schema';

/**
 * 회원가입 플로우가 여러 화면에 걸쳐 들고 다니는 값.
 *
 * 라우터 search params 대신 store를 쓰는 이유는 `passwordResetStore`와 같다 —
 * 인증 token·소셜 가입 token·비밀번호는 화면 주소에 노출되면 안 된다.
 *
 * **저장소에 persist 하지 않는다.** 가입은 한 번에 끝내는 흐름이고, 소셜 가입 token은
 * 계약상 메모리에만 두라고 돼 있다(01-auth.md §5). 앱을 다시 켜면 처음부터다.
 */

/**
 * 가입 방식. 소셜은 서비스 비밀번호를 만들지 않아(AUTH-13) 비밀번호 단계가 빠진다.
 */
export type SignupMode = 'email' | 'social';

export type SignupStep = 'name' | 'email' | 'code' | 'password' | 'terms';

/** 방식별 단계 순서. 진행 표시(`StepProgressBar`)와 다음 화면 판단이 여기서 나온다. */
export const SIGNUP_STEPS: Record<SignupMode, readonly SignupStep[]> = {
  email: ['name', 'email', 'code', 'password', 'terms'],
  social: ['name', 'email', 'code', 'terms'],
};

type Agreements = Record<TermsCode, boolean>;

type SignupState = {
  mode: SignupMode;
  /** 소셜 가입일 때만. 가입 완료 요청의 경로(`/auth/social/{provider}/signup`)를 정한다. */
  provider: SocialProvider | null;
  /** 소셜 인증이 발급한 10분 유효·단회 사용 token. 가입 완료 전까지 메모리에만 둔다. */
  socialSignupToken: string | null;
  /**
   * 소셜 가입 token의 만료 시각(epoch ms).
   *
   * 소셜 가입은 이름·이메일·인증코드·약관 네 단계를 거치는데 token 수명은 10분이라
   * 중간에 만료되는 경우가 실제로 생긴다. 만료된 token으로 가입을 제출하면 서버가
   * `409 SOCIAL_SIGNUP_TOKEN_INVALID`를 준다(계약 §12-2). 헛된 왕복을 줄이려고
   * 제출 직전에 이 값으로 먼저 거른다.
   */
  socialSignupExpiresAt: number | null;
  displayName: string;
  email: string;
  /** 인증코드 만료 시각(epoch ms). 카운트다운의 기준. */
  expiresAt: number | null;
  /** 재발송이 가능해지는 시각(epoch ms). */
  resendAvailableAt: number | null;
  /** 인증 완료 후 서버가 준 일회성 token. `emailVerificationToken`으로 제출한다. */
  verificationToken: string | null;
  /** 이메일 가입일 때만. 약관 단계까지 들고 갔다가 제출과 함께 지운다. */
  password: string;
  agreements: Agreements;
  /**
   * 계정 생성 직후의 세션. 완료 화면을 보여주는 동안만 여기 있다가 "시작하기"에서
   * `authStore.signIn`으로 옮겨진다. 바로 로그인 처리하면 완료 화면을 못 본다.
   */
  pendingSession: Session | null;
};

type SignupActions = {
  /** 이메일 가입 시작. 이전에 하다 만 값이 있어도 전부 버린다. */
  startEmailSignup: () => void;
  /** 소셜 인증 후 신규 식별자로 판정된 경우. 제공자가 준 기본값을 미리 채운다. */
  startSocialSignup: (params: {
    provider: SocialProvider;
    socialSignupToken: string;
    /** 서버가 준 token 만료 시각(ISO 8601). */
    expiresAt: string;
    suggestedDisplayName?: string;
    suggestedEmail?: string;
  }) => void;
  setDisplayName: (displayName: string) => void;
  /** 인증코드를 보냈다. 이메일이 바뀌면 이전 인증 결과는 무효다. */
  startChallenge: (params: { email: string; expiresAt: string; resendAvailableAt: string }) => void;
  /** 재발송. 이메일은 그대로 두고 만료·재발송 시각만 새로 받는다. */
  refreshChallenge: (params: { expiresAt: string; resendAvailableAt: string }) => void;
  /** 이메일 입력이 바뀌었다. 인증 상태를 반드시 초기화한다(AUTH-07 우회 방지). */
  resetChallenge: () => void;
  completeVerification: (verificationToken: string) => void;
  setPassword: (password: string) => void;
  setAgreement: (code: TermsCode, agreed: boolean) => void;
  setAllAgreements: (agreed: boolean) => void;
  setPendingSession: (session: Session) => void;
  clear: () => void;
};

export type SignupStore = SignupState & SignupActions;

const EMPTY_AGREEMENTS: Agreements = {
  TERMS_OF_SERVICE: false,
  PRIVACY_COLLECTION_USE: false,
  MARKETING_INFORMATION_RECEIPT: false,
};

const EMPTY: SignupState = {
  mode: 'email',
  provider: null,
  socialSignupToken: null,
  socialSignupExpiresAt: null,
  displayName: '',
  email: '',
  expiresAt: null,
  resendAvailableAt: null,
  verificationToken: null,
  password: '',
  agreements: EMPTY_AGREEMENTS,
  pendingSession: null,
};

export const useSignupStore = create<SignupStore>()((set) => ({
  ...EMPTY,

  startEmailSignup: () => set({ ...EMPTY, mode: 'email' }),

  startSocialSignup: ({
    provider,
    socialSignupToken,
    expiresAt,
    suggestedDisplayName,
    suggestedEmail,
  }) =>
    set({
      ...EMPTY,
      mode: 'social',
      provider,
      socialSignupToken,
      socialSignupExpiresAt: Date.parse(expiresAt),
      displayName: suggestedDisplayName ?? '',
      // 제공자 기본값은 수정 가능한 초기값일 뿐이다. Baton 이메일 인증을 대체하지 않는다.
      email: suggestedEmail ?? '',
    }),

  setDisplayName: (displayName) => set({ displayName }),

  startChallenge: ({ email, expiresAt, resendAvailableAt }) =>
    set({
      email,
      expiresAt: Date.parse(expiresAt),
      resendAvailableAt: Date.parse(resendAvailableAt),
      verificationToken: null,
    }),

  refreshChallenge: ({ expiresAt, resendAvailableAt }) =>
    set({
      expiresAt: Date.parse(expiresAt),
      resendAvailableAt: Date.parse(resendAvailableAt),
      verificationToken: null,
    }),

  resetChallenge: () => set({ expiresAt: null, resendAvailableAt: null, verificationToken: null }),

  completeVerification: (verificationToken) => set({ verificationToken }),

  setPassword: (password) => set({ password }),

  setAgreement: (code, agreed) =>
    set((state) => ({ agreements: { ...state.agreements, [code]: agreed } })),

  setAllAgreements: (agreed) =>
    set({
      agreements: {
        TERMS_OF_SERVICE: agreed,
        PRIVACY_COLLECTION_USE: agreed,
        MARKETING_INFORMATION_RECEIPT: agreed,
      },
    }),

  setPendingSession: (pendingSession) => set({ pendingSession }),

  clear: () => set(EMPTY),
}));

/** 현재 단계의 위치(1부터)와 전체 단계 수. 진행 표시용. */
export function getStepProgress(
  mode: SignupMode,
  step: SignupStep,
): { current: number; total: number } {
  const steps = SIGNUP_STEPS[mode];
  return { current: steps.indexOf(step) + 1, total: steps.length };
}

/** 다음 단계. 마지막 단계면 `null`. */
export function getNextStep(mode: SignupMode, step: SignupStep): SignupStep | null {
  const steps = SIGNUP_STEPS[mode];
  return steps[steps.indexOf(step) + 1] ?? null;
}

/**
 * 소셜 가입 token이 이미 만료됐는지. 만료 시각을 모르면(`null`) 만료로 보지 않는다 —
 * 서버 판단이 기준이고, 여기서는 확실할 때만 미리 거른다.
 */
export function hasSocialSignupTokenExpired(
  socialSignupExpiresAt: number | null,
  now: number = Date.now(),
): boolean {
  return socialSignupExpiresAt !== null && socialSignupExpiresAt <= now;
}

/** 필수 약관에 모두 동의했는지. 제출 버튼의 활성 조건. */
export function hasRequiredAgreements(agreements: Agreements): boolean {
  return TERMS.every((term) => !term.isRequired || agreements[term.code]);
}

/** 계약이 요구하는 형태 — 세 코드를 중복 없이 모두, 선택 약관은 `agreed: false`로. */
export function toAgreementDecisions(agreements: Agreements): AgreementDecision[] {
  return TERMS.map((term) => ({ termsCode: term.code, agreed: agreements[term.code] }));
}
