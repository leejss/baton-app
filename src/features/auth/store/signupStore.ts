import {
  EMPTY_VERIFICATION,
  normalizeEmail,
  verificationTokenValues,
  type VerificationState,
  type VerificationActions,
} from '@/features/auth/lib/emailVerification';
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

type SignupState = VerificationState & {
  mode: SignupMode;
  submissionUncertain: boolean;
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
  /** 이메일 가입일 때만. 약관 단계까지 들고 갔다가 제출과 함께 지운다. */
  password: string;
  agreements: Agreements;
  /**
   * 계정 생성 직후의 세션. 완료 화면을 보여주는 동안만 여기 있다가 "시작하기"에서
   * `authStore.signIn`으로 옮겨진다. 바로 로그인 처리하면 완료 화면을 못 본다.
   */
  pendingSession: Session | null;
};

type SignupActions = VerificationActions & {
  /** 이메일 가입 시작. 이전에 하다 만 값이 있어도 전부 버린다. */
  startEmailSignup: () => void;
  /** 소셜 인증 후 신규 가입을 시작한다. 이름과 이메일은 사용자가 직접 입력한다. */
  startSocialSignup: (params: {
    provider: SocialProvider;
    socialSignupToken: string;
    /** 서버가 준 token 만료 시각(ISO 8601). */
    expiresAt: string;
  }) => void;
  setSubmissionUncertain: (value: boolean) => void;
  setDisplayName: (displayName: string) => void;
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
  ...EMPTY_VERIFICATION,
  mode: 'email',
  submissionUncertain: false,
  provider: null,
  socialSignupToken: null,
  socialSignupExpiresAt: null,
  displayName: '',
  password: '',
  agreements: EMPTY_AGREEMENTS,
  pendingSession: null,
};

export const useSignupStore = create<SignupStore>()((set) => ({
  ...EMPTY,

  startEmailSignup: () =>
    set((state) => ({
      ...EMPTY,
      mode: 'email',
      verificationRevision: state.verificationRevision + 1,
    })),

  startSocialSignup: ({ provider, socialSignupToken, expiresAt }) =>
    set((state) => ({
      ...EMPTY,
      verificationRevision: state.verificationRevision + 1,
      mode: 'social',
      provider,
      socialSignupToken,
      socialSignupExpiresAt: Date.parse(expiresAt),
    })),

  setSubmissionUncertain: (submissionUncertain) => set({ submissionUncertain }),

  setDisplayName: (displayName) => set({ displayName }),

  setVerificationEmail: (email) =>
    set((state) =>
      normalizeEmail(email) === state.email
        ? state
        : {
            ...EMPTY_VERIFICATION,
            email: normalizeEmail(email),
            verificationRevision: state.verificationRevision + 1,
          },
    ),

  startChallenge: ({ email, expiresAt, resendAvailableAt, recovered }) =>
    set((state) => ({
      email: normalizeEmail(email),
      expiresAt: Date.parse(expiresAt),
      resendAvailableAt: Date.parse(resendAvailableAt),
      verificationToken: null,
      verificationTokenExpiresAt: null,
      challengeStatus: recovered ? 'recovered' : 'sent',
      verificationRevision: state.verificationRevision + 1,
    })),

  refreshChallenge: ({ expiresAt, resendAvailableAt }) =>
    set((state) => ({
      expiresAt: Date.parse(expiresAt),
      resendAvailableAt: Date.parse(resendAvailableAt),
      verificationToken: null,
      verificationTokenExpiresAt: null,
      challengeStatus: 'sent',
      verificationRevision: state.verificationRevision + 1,
    })),

  resetChallenge: () =>
    set((state) => ({
      ...EMPTY_VERIFICATION,
      email: state.email,
      verificationRevision: state.verificationRevision + 1,
    })),

  invalidateChallenge: () =>
    set((state) => ({
      ...EMPTY_VERIFICATION,
      email: state.email,
      challengeStatus: 'uncertain',
      verificationRevision: state.verificationRevision + 1,
    })),

  clearVerification: () =>
    set((state) => ({
      verificationToken: null,
      verificationTokenExpiresAt: null,
      verificationRevision: state.verificationRevision + 1,
    })),

  completeVerification: (token, expiresAt) =>
    set((state) => ({
      submissionUncertain: false,
      ...verificationTokenValues(token, expiresAt),
      verificationRevision: state.verificationRevision + 1,
    })),

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

  clear: () =>
    set((state) => ({
      ...EMPTY,
      verificationRevision: state.verificationRevision + 1,
    })),
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
  return TERMS.map((term) => ({
    termsCode: term.code,
    agreed: agreements[term.code],
  }));
}
