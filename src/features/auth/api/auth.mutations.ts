import { useMutation } from '@tanstack/react-query';

import { isAppError, normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';

import { exchangeKakaoToken } from '@/features/auth/api/auth.api';
import { signInWithKakao } from '@/features/auth/lib/kakaoAuth';
import { useAuthStore } from '@/features/auth/store/authStore';

/** 취소는 실패가 아니다. 화면에서 에러 UI를 띄우지 않도록 걸러내는 데 쓴다. */
export function isCanceled(error: unknown): boolean {
  return isAppError(error) && error.code === 'canceled';
}

/**
 * 카카오 로그인 → 서버 세션 교환 → 스토어 반영까지를 한 흐름으로 묶는다.
 * 화면은 `mutate()`와 `isPending`, `error`만 보면 된다.
 */
export function useKakaoSignIn() {
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: async () => {
      const kakaoAccessToken = await signInWithKakao();
      return exchangeKakaoToken(kakaoAccessToken);
    },
    onSuccess: (session) => signIn(session),
    onError: (error) => {
      const appError = normalizeError(error);
      if (isCanceled(appError)) {
        return;
      }
      // 토큰·개인정보는 절대 싣지 않는다. 실패 종류만 남긴다.
      logger.warn('카카오 로그인 실패', { code: appError.code });
    },
  });
}
