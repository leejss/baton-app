import { logger } from '@/shared/lib/logger';
import { useMutation } from '@tanstack/react-query';

import {
  requestVerificationCode,
  resetPassword,
  verifyCode,
} from '@/features/auth/api/passwordReset.api';

/**
 * 인증코드 발송·재발송. 계약에 재발송 플래그가 없다 — 같은 요청이고, 너무 이르면
 * 서버가 `429 EMAIL_VERIFICATION_RESEND_TOO_SOON`으로 막는다.
 */
export function useRequestVerificationCode() {
  return useMutation({
    onError: (error) => {
      logger.error('비밀번호 재설정 인증 코드 발송 실패', error);
    },
    mutationFn: ({ email }: { email: string }) => requestVerificationCode(email),
  });
}

export function useVerifyCode() {
  return useMutation({
    onError: (error) => {
      logger.error('비밀번호 재설정 인증 코드 확인 실패', error);
    },
    mutationFn: ({ email, code }: { email: string; code: string }) => verifyCode(email, code),
  });
}

export function useResetPassword() {
  return useMutation({
    onError: (error) => {
      logger.error('비밀번호 재설정 실패', error);
    },
    mutationFn: (params: { email: string; emailVerificationToken: string; newPassword: string }) =>
      resetPassword(params),
  });
}
