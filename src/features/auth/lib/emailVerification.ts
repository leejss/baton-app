import type { VerificationChallenge } from '@/features/auth/api/passwordReset.schema';
import {
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_RESEND_COOLDOWN_MS,
} from '@/features/auth/api/passwordReset.schema';
import { normalizeError } from '@/shared/api/errors';

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export type VerificationState = {
  email: string;
  expiresAt: number | null;
  resendAvailableAt: number | null;
  verificationToken: string | null;
  verificationTokenExpiresAt: number | null;
  challengeStatus: 'none' | 'sent' | 'recovered' | 'uncertain';
  verificationRevision: number;
};

export type VerificationActions = {
  setVerificationEmail: (email: string) => void;
  startChallenge: (
    challenge: VerificationChallenge & { email: string; recovered?: boolean },
  ) => void;
  refreshChallenge: (challenge: VerificationChallenge) => void;
  resetChallenge: () => void;
  invalidateChallenge: () => void;
  clearVerification: () => void;
  completeVerification: (verificationToken: string, expiresAt: string) => void;
};

export const EMPTY_VERIFICATION: VerificationState = {
  email: '',
  expiresAt: null,
  resendAvailableAt: null,
  verificationToken: null,
  verificationTokenExpiresAt: null,
  challengeStatus: 'none',
  verificationRevision: 0,
};

export function hasValidVerification(
  state: Pick<VerificationState, 'verificationToken' | 'verificationTokenExpiresAt'>,
): boolean {
  return (
    state.verificationToken !== null &&
    state.verificationTokenExpiresAt !== null &&
    state.verificationTokenExpiresAt > Date.now()
  );
}

export function hasValidChallenge(state: VerificationState): boolean {
  return (
    (state.challengeStatus === 'sent' || state.challengeStatus === 'recovered') &&
    state.expiresAt !== null &&
    state.expiresAt > Date.now()
  );
}

/** 429에는 만료 시각이 없다. 저장된 유효 시각을 우선하고, 없는 경우에만 계약의 TTL로 복구한다. */
export function recoverChallenge(error: unknown, state: VerificationState): VerificationChallenge {
  const retryAfter =
    normalizeError(error).retryAfterSeconds ?? VERIFICATION_RESEND_COOLDOWN_MS / 1000;
  const resendAt = Date.now() + retryAfter * 1000;
  return {
    resendAvailableAt: new Date(resendAt).toISOString(),
    expiresAt: new Date(
      hasValidChallenge(state) && state.expiresAt !== null
        ? state.expiresAt
        : resendAt + VERIFICATION_CODE_TTL_MS - VERIFICATION_RESEND_COOLDOWN_MS,
    ).toISOString(),
  };
}

export function verificationTokenValues(
  token: string,
  expiresAt: string,
): Pick<VerificationState, 'verificationToken' | 'verificationTokenExpiresAt'> {
  return {
    verificationToken: token,
    verificationTokenExpiresAt: Date.parse(expiresAt),
  };
}
