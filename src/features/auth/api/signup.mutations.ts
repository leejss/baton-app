import { useMutation } from '@tanstack/react-query';

import { hasServerErrorCode, normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';

import { requestVerificationCode, verifyCode } from '@/features/auth/api/passwordReset.api';
import { signUpWithEmail, signUpWithSocial } from '@/features/auth/api/signup.api';
import type { SignUpParams, SocialSignUpParams } from '@/features/auth/api/signup.schema';

/** 실패 로그에 이메일·비밀번호·token을 싣지 않는다. 실패 종류만 남긴다. */
function logFailure(step: string) {
  return (error: unknown) =>
    logger.warn('회원가입 실패', { step, code: normalizeError(error).code });
}

/** 이미 활성 계정에 등록된 이메일인지. 시안 "동일한 이메일이 이미 있는 경우" 모달의 분기 조건. */
export function isEmailTaken(error: unknown): boolean {
  return hasServerErrorCode(error, 'AUTH_ACCOUNT_ALREADY_EXISTS');
}

/**
 * 쿨다운 때문에 재발송이 거절된 경우(`429`).
 *
 * **실패가 아니다.** 재발송이 일어나지 않았다는 뜻이고, 직전에 보낸 코드는 그대로 살아 있다
 * (`requirements.md`: 재발송해야 이전 코드가 무효화된다). 화면은 "이미 보냈다"고 안내하고
 * 다음 단계를 열어줘야 한다.
 */
export function isResendTooSoon(error: unknown): boolean {
  return hasServerErrorCode(error, 'EMAIL_VERIFICATION_RESEND_TOO_SOON');
}

/**
 * 소셜 가입 token이 더 이상 유효하지 않은 경우(`409 SOCIAL_SIGNUP_TOKEN_INVALID`).
 *
 * token은 10분·단회 사용이고, 소셜 인증을 다시 하면 이전 token이 **대체**된다.
 * 즉 만료·소비·대체 어느 쪽이든 화면이 할 일은 같다 — 소셜 로그인을 다시 시키는 것이다.
 * 서버는 만료 가입 대기 재인증에 `200 SIGNUP_REQUIRED`와 새 token으로 응답하므로
 * (ADR-030) 다시 로그인하면 가입을 이어갈 수 있다.
 */
export function isSocialSignupTokenInvalid(error: unknown): boolean {
  return hasServerErrorCode(error, 'SOCIAL_SIGNUP_TOKEN_INVALID');
}

/**
 * 가입용 인증코드 발송·재발송. 시안의 "중복확인" 버튼이 이걸 부른다 —
 * 계약상 이메일 중복은 이 요청의 `409 AUTH_ACCOUNT_ALREADY_EXISTS`로만 알 수 있다.
 */
export function useRequestSignupCode() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) =>
      requestVerificationCode(email, { purpose: 'SIGN_UP' }),
    onError: (error) => {
      // 중복 이메일은 화면이 모달로 안내하는 정상 결과라 경고 로그를 남기지 않는다.
      if (!isEmailTaken(error)) {
        logFailure('requestCode')(error);
      }
    },
  });
}

export function useVerifySignupCode() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      verifyCode(email, code, { purpose: 'SIGN_UP' }),
    onError: logFailure('verifyCode'),
  });
}

/**
 * 계정 생성. 세션을 **스토어에 넣지 않고 돌려준다** — 완료 화면("회원가입이 완료 됐어요")을
 * 먼저 보여준 뒤 "시작하기"에서 로그인 상태로 전환해야 해서다. 여기서 바로 `signIn`하면
 * `(auth)/_layout`의 가드가 완료 화면을 건너뛰고 앱 안쪽으로 보낸다.
 */
export function useSignUp() {
  return useMutation({
    mutationFn: (params: SignUpParams | SocialSignUpParams) =>
      'socialSignupToken' in params ? signUpWithSocial(params) : signUpWithEmail(params),
    onError: logFailure('signUp'),
  });
}
