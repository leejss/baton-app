import { create } from 'zustand';

import {
  EMPTY_VERIFICATION,
  normalizeEmail,
  verificationTokenValues,
  type VerificationState,
  type VerificationActions,
} from '@/features/auth/lib/emailVerification';

// 인증 중인 값은 메모리에만 보관하고 앱 재시작 시 초기화한다.
export type PasswordResetStore = VerificationState &
  VerificationActions & {
    isComplete: boolean;
    markComplete: () => void;
    submissionUncertain: boolean;
    setSubmissionUncertain: (value: boolean) => void;
    clear: () => void;
  };

export const usePasswordResetStore = create<PasswordResetStore>()((set) => ({
  ...EMPTY_VERIFICATION,
  submissionUncertain: false,
  isComplete: false,
  markComplete: () => set({ isComplete: true }),
  setSubmissionUncertain: (submissionUncertain) => set({ submissionUncertain }),
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
      isComplete: false,
      submissionUncertain: false,
      ...verificationTokenValues(token, expiresAt),
      verificationRevision: state.verificationRevision + 1,
    })),

  clear: () =>
    set((state) => ({
      ...EMPTY_VERIFICATION,
      submissionUncertain: false,
      isComplete: false,
      verificationRevision: state.verificationRevision + 1,
    })),
}));
