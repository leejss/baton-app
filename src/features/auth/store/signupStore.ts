import { create } from 'zustand';
import type { Session } from '@/features/auth/api/auth.schema';
import {
  TERMS,
  type AgreementDecision,
  type SocialProvider,
  type TermsCode,
} from '@/features/auth/api/signup.schema';

type Agreements = Record<TermsCode, boolean>;
type SignupState = {
  provider: SocialProvider | null;
  socialSignupToken: string | null;
  socialSignupExpiresAt: number | null;
  displayName: string;
  agreements: Agreements;
  submissionUncertain: boolean;
  pendingSession: Session | null;
};
type SignupActions = {
  startSocialSignup: (params: {
    provider: SocialProvider;
    socialSignupToken: string;
    expiresAt: string;
  }) => void;
  setDisplayName: (displayName: string) => void;
  setAgreement: (code: TermsCode, agreed: boolean) => void;
  setAllAgreements: (agreed: boolean) => void;
  setSubmissionUncertain: (value: boolean) => void;
  setPendingSession: (session: Session) => void;
  clear: () => void;
};
type SignupStore = SignupState & SignupActions;
const EMPTY: SignupState = {
  provider: null,
  socialSignupToken: null,
  socialSignupExpiresAt: null,
  displayName: '',
  submissionUncertain: false,
  pendingSession: null,
  agreements: {
    TERMS_OF_SERVICE: false,
    PRIVACY_COLLECTION_USE: false,
    MARKETING_INFORMATION_RECEIPT: false,
  },
};
/** 가입 토큰과 완료 세션은 메모리에만 보관한다. 초대 링크 보존은 별도 워크스페이스 상태에서 처리한다. */
export const useSignupStore = create<SignupStore>()((set) => ({
  ...EMPTY,
  startSocialSignup: ({ provider, socialSignupToken, expiresAt }) =>
    set({ ...EMPTY, provider, socialSignupToken, socialSignupExpiresAt: Date.parse(expiresAt) }),
  setDisplayName: (displayName) => set({ displayName }),
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
  setSubmissionUncertain: (submissionUncertain) => set({ submissionUncertain }),
  setPendingSession: (pendingSession) => set({ pendingSession }),
  clear: () => set({ ...EMPTY }),
}));
export function hasSocialSignupTokenExpired(expiresAt: number | null, now = Date.now()): boolean {
  return expiresAt === null || !Number.isFinite(expiresAt) || expiresAt <= now;
}
export function hasRequiredAgreements(agreements: Agreements): boolean {
  return TERMS.every((term) => !term.isRequired || agreements[term.code]);
}
export const toAgreementDecisions = (agreements: Agreements): AgreementDecision[] =>
  TERMS.map((term) => ({ termsCode: term.code, agreed: agreements[term.code] }));
