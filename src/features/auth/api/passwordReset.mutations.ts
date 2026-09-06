import { useMutation } from '@tanstack/react-query';

import { normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';

import {
  requestVerificationCode,
  resetPassword,
  verifyCode,
} from '@/features/auth/api/passwordReset.api';

/** 실패 로그에 이메일·코드·비밀번호를 싣지 않는다. 실패 종류만 남긴다. */
function logFailure(step: string) {
  return (error: unknown) =>
    logger.warn('비밀번호 재설정 실패', { step, code: normalizeError(error).code });
}

/**
 * 인증코드 발송·재발송. 계약에 재발송 플래그가 없다 — 같은 요청이고, 너무 이르면
 * 서버가 `429 EMAIL_VERIFICATION_RESEND_TOO_SOON`으로 막는다.
 */
export function useRequestVerificationCode() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => requestVerificationCode(email),
    onError: logFailure('requestCode'),
  });
}

export function useVerifyCode() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => verifyCode(email, code),
    onError: logFailure('verifyCode'),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (params: { email: string; emailVerificationToken: string; newPassword: string }) =>
      resetPassword(params),
    onError: logFailure('resetPassword'),
  });
}
