import { logger } from '@/shared/lib/logger';
import { useMutation } from '@tanstack/react-query';

import { isAppError } from '@/shared/api/errors';

import {
  authenticateWithApple,
  authenticateWithKakao,
  signInWithEmail,
} from '@/features/auth/api/auth.api';
import type { SignInOutcome } from '@/features/auth/api/auth.schema';
import { signInWithApple } from '@/features/auth/lib/appleAuth';
import { signInWithKakao } from '@/features/auth/lib/kakaoAuth';
import { useAuthStore } from '@/features/auth/store/authStore';

/** 취소는 실패가 아니다. 화면에서 에러 UI를 띄우지 않도록 걸러내는 데 쓴다. */
export function isCanceled(error: unknown): boolean {
  return isAppError(error) && error.code === 'canceled';
}

/**
 * 카카오 로그인 → 서버 인증 → 스토어 반영까지를 한 흐름으로 묶는다.
 *
 * 계약상 응답이 두 갈래다(§12-1). 연결된 계정이면 세션이 오고, 신규 소셜 식별자면
 * `SIGNUP_REQUIRED`와 10분짜리 가입 token이 온다. 후자는 **로그인이 아니므로**
 * 세션을 만들지 않고 화면이 가입 플로우로 이어가야 한다.
 */
export function useKakaoSignIn() {
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    onError: (error) => {
      logger.error('카카오 로그인 실패', error);
    },
    mutationFn: async () => {
      const kakaoAccessToken = await signInWithKakao();
      return authenticateWithKakao(kakaoAccessToken);
    },
    onSuccess: async (outcome) => {
      if (outcome.status === 'signedIn') {
        await signIn(outcome.session);
        logger.info('카카오 로그인 완료');
      }
    },
  });
}

/**
 * Apple 로그인 → 서버 인증 → 스토어 반영. 카카오와 같은 흐름이고 갈래도 같다
 * (연결된 계정이면 세션, 신규 소셜 식별자면 `SIGNUP_REQUIRED`).
 *
 * iOS 전용이라 호출 전에 `isAppleSignInAvailable()`로 버튼 노출을 걸러야 한다.
 */
export function useAppleSignIn() {
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    onError: (error) => {
      logger.error('Apple 로그인 실패', error);
    },
    mutationFn: async () => {
      logger.info('Apple 네이티브 인증 시작');
      const credential = await signInWithApple();
      logger.info('Apple 네이티브 인증 완료');
      logger.info('Apple 서버 인증 시작');
      return authenticateWithApple(credential);
    },
    onSuccess: async (outcome) => {
      if (outcome.status === 'signedIn') {
        await signIn(outcome.session);
        logger.info('Apple 로그인 완료');
      }
    },
  });
}

/**
 * 이메일 로그인. 성공하면 세션을 저장하고, 실패 사유(비밀번호 불일치·로그인 제한)는
 * 에러가 아니라 결과값으로 돌려준다 — 화면이 `status`로 분기해 시안의 오류 UI를 고른다.
 */
export function useEmailSignIn() {
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    onError: (error) => {
      logger.error('이메일 로그인 실패', error);
    },
    mutationFn: ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }): Promise<SignInOutcome> => signInWithEmail(email, password),
    onSuccess: async (outcome) => {
      if (outcome.status === 'signedIn') {
        await signIn(outcome.session);
        logger.info('이메일 로그인 완료');
      }
    },
  });
}
