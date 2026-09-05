import { IS_BACKEND_READY, post, postJson } from '@/shared/api/client';

import {
  mockRequestVerificationCode,
  mockResetPassword,
  mockVerifyCode,
} from '@/features/auth/api/auth.mock';
import {
  verificationChallengeSchema,
  verificationResultSchema,
  type VerificationChallenge,
  type VerifyCodeOutcome,
} from '@/features/auth/api/passwordReset.schema';

/**
 * 비밀번호 재설정 API.
 *
 * 백엔드가 없는 동안에는 `auth.mock`으로 대체된다. 서버가 붙으면 `.env`에
 * `EXPO_PUBLIC_API_URL`만 채우면 아래 분기가 자동으로 실제 요청 쪽으로 넘어간다.
 */

/** 인증코드 발송·재발송. 서버가 만료 시각과 재발송 가능 시각을 정한다. */
export async function requestVerificationCode(
  email: string,
  options?: { resend?: boolean; signal?: AbortSignal },
): Promise<VerificationChallenge> {
  if (!IS_BACKEND_READY) {
    return mockRequestVerificationCode(email);
  }

  return postJson(
    '/auth/email/code',
    { email, resend: options?.resend ?? false },
    verificationChallengeSchema,
    options?.signal,
  );
}

/**
 * 인증코드 확인.
 *
 * 불일치·만료는 정상적인 결과라 throw 하지 않는다. 서버는 이 두 경우를 4xx가 아니라
 * 200 + 상태값으로 내려주길 제안한다 — 그래야 화면이 에러 배너 대신 필드 문구로 안내한다.
 */
export async function verifyCode(
  email: string,
  code: string,
  signal?: AbortSignal,
): Promise<VerifyCodeOutcome> {
  if (!IS_BACKEND_READY) {
    return mockVerifyCode(email, code);
  }

  const result = await postJson(
    '/auth/email/code/verify',
    { email, code },
    verificationResultSchema,
    signal,
  );

  return { status: 'verified', verifyToken: result.verifyToken };
}

/** 새 비밀번호 확정. 이메일 인증이 끝난 뒤에만 호출된다. */
export async function resetPassword(
  params: { email: string; verifyToken: string; password: string },
  signal?: AbortSignal,
): Promise<void> {
  if (!IS_BACKEND_READY) {
    return mockResetPassword();
  }

  await post('/auth/password/reset', params, signal);
}
