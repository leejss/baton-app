import { useMutation } from '@tanstack/react-query';

import { isAppError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';
import { authenticateWithApple, authenticateWithKakao } from '@/features/auth/api/auth.api';
import { signInWithApple } from '@/features/auth/lib/appleAuth';
import { signInWithKakao } from '@/features/auth/lib/kakaoAuth';
import { requestNativeSignIn } from '@/features/auth/lib/nativeSignIn';

export function isCanceled(error: unknown): boolean {
  return isAppError(error) && error.code === 'canceled';
}

// 결과만 반환한다. 세션 저장은 화면의 현재 요청인지 확인한 뒤 수행한다.
export function useKakaoSignIn() {
  return useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: async ({ signal }: { signal: AbortSignal }) => {
      const accessToken = await requestNativeSignIn(signInWithKakao, signal);
      return authenticateWithKakao(accessToken, signal);
    },
    onError: (error) => {
      if (!isCanceled(error)) logger.error('카카오 로그인 실패', error);
    },
  });
}

export function useAppleSignIn() {
  return useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: async ({ signal }: { signal: AbortSignal }) => {
      const credential = await requestNativeSignIn(signInWithApple, signal);
      return authenticateWithApple(credential, signal);
    },
    onError: (error) => {
      if (!isCanceled(error)) logger.error('Apple 로그인 실패', error);
    },
  });
}
