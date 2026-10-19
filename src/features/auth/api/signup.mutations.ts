import { useMutation } from '@tanstack/react-query';
import { hasServerErrorCode, isAppError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';
import { signUpWithSocial } from '@/features/auth/api/signup.api';
import type { SocialSignUpParams } from '@/features/auth/api/signup.schema';
export const isSocialSignupTokenInvalid = (error: unknown): boolean =>
  hasServerErrorCode(error, 'SOCIAL_SIGNUP_TOKEN_INVALID');
/** 완료 화면에서 시작하기 전까지 로그인 세션은 가입 상태에 둔다. */
export function useSignUp() {
  return useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: ({ signal, ...params }: SocialSignUpParams & { signal?: AbortSignal }) =>
      signUpWithSocial(params, signal),
    onError: (error) => {
      if (!(isAppError(error) && error.code === 'canceled'))
        logger.error('소셜 회원가입 실패', error);
    },
    onSuccess: () => logger.info('소셜 회원가입 완료'),
  });
}
