import { post, postVoid } from '@/shared/api/client';
import { normalizeError } from '@/shared/api/errors';

import {
  mockRequestVerificationCode,
  mockResetPassword,
  mockVerifyCode,
  USE_MOCK_AUTH,
} from '@/features/auth/api/auth.mock';
import {
  verificationChallengeSchema,
  verificationTokenSchema,
  type VerificationChallenge,
  type VerificationPurpose,
  type VerifyCodeOutcome,
} from '@/features/auth/api/passwordReset.schema';

/**
 * 이메일 인증·비밀번호 재설정 API. 경로·필드는 wiki `openapi.yaml`(ADR-026 확정본)을 따른다.
 * 모두 `공개` 엔드포인트라 토큰을 싣지 않는다.
 *
 * 백엔드가 아직 배포되지 않아 `USE_MOCK_AUTH`가 켜져 있으면 `auth.mock`이 대신한다.
 */

/**
 * 인증코드 발송·재발송.
 *
 * 계약에는 `resend` 플래그가 없다 — 재발송도 같은 요청이고, 너무 이르면 서버가
 * `429 EMAIL_VERIFICATION_RESEND_TOO_SOON` + `Retry-After`로 막는다.
 * 다음 재발송 가능 시각은 성공 응답의 `resendAvailableAt`이 알려준다.
 */
export async function requestVerificationCode(
  email: string,
  options?: { purpose?: VerificationPurpose; signal?: AbortSignal },
): Promise<VerificationChallenge> {
  const purpose = options?.purpose ?? 'PASSWORD_RESET';

  if (USE_MOCK_AUTH) {
    return mockRequestVerificationCode(email);
  }

  return post('/auth/email-verifications', { email, purpose }, verificationChallengeSchema, {
    signal: options?.signal,
    auth: false,
  });
}

/**
 * 인증코드 확인.
 *
 * 코드가 틀렸거나 만료된 경우 계약은 둘 다 `400`으로 내린다. 화면에서는 정상 결과라
 * throw 하지 않고 `invalid`로 돌려준다 — 진짜 예외(네트워크 등)만 throw 한다.
 */
export async function verifyCode(
  email: string,
  code: string,
  options?: { purpose?: VerificationPurpose; signal?: AbortSignal },
): Promise<VerifyCodeOutcome> {
  const purpose = options?.purpose ?? 'PASSWORD_RESET';

  if (USE_MOCK_AUTH) {
    return mockVerifyCode(email, code);
  }

  try {
    const result = await post(
      '/auth/email-verifications/confirm',
      { email, purpose, code },
      verificationTokenSchema,
      { signal: options?.signal, auth: false },
    );
    return { status: 'verified', ...result };
  } catch (error) {
    const appError = normalizeError(error);
    if (appError.status === 400) {
      return { status: 'invalid' };
    }
    throw appError;
  }
}

/**
 * 새 비밀번호 확정. 이메일 인증이 끝난 뒤에만 호출된다.
 * 성공하면 서버가 **기존 세션을 모두 폐기**한다 — 다른 기기도 로그아웃된다.
 */
export async function resetPassword(
  params: { email: string; emailVerificationToken: string; newPassword: string },
  signal?: AbortSignal,
): Promise<void> {
  if (USE_MOCK_AUTH) {
    return mockResetPassword();
  }

  await postVoid('/auth/password-resets', params, { signal, auth: false });
}
