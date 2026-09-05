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
  return (error: unknown) => logger.warn('비밀번호 재설정 실패', { step, code: normalizeError(error).code });
}

/** 인증코드 발송·재발송. `resend`만 다르고 응답 형태는 같다. */
export function useRequestVerificationCode() {
  return useMutation({
    mutationFn: ({ email, resend = false }: { email: string; resend?: boolean }) =>
      requestVerificationCode(email, { resend }),
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
    mutationFn: (params: { email: string; verifyToken: string; password: string }) =>
      resetPassword(params),
    onError: logFailure('resetPassword'),
  });
}
