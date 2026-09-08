import { z } from 'zod';

/**
 * 이메일 인증·비밀번호 재설정 스키마. 출처는 wiki `openapi.yaml`(ADR-026 확정본)이다.
 *
 *   POST /auth/email-verifications          { email, purpose }        → { expiresAt, resendAvailableAt }
 *   POST /auth/email-verifications/confirm  { email, purpose, code }  → { verificationToken, expiresAt }
 *   POST /auth/password-resets              { email, emailVerificationToken, newPassword } → 204
 */

/** 인증 코드의 용도. 같은 이메일이라도 목적이 다르면 별개의 token이다. */
export const verificationPurposeSchema = z.enum(['SIGN_UP', 'PASSWORD_RESET']);
export type VerificationPurpose = z.infer<typeof verificationPurposeSchema>;

/**
 * 인증코드 정책. 출처: wiki `requirements.md` — "유효 시간은 3분이다.
 * 같은 이메일·목적의 재발송은 1분 후 가능하고 재발송하면 이전 코드를 즉시 무효화한다."
 *
 * 서버가 기준이고 앱은 **429에서 시각을 역산할 때만** 쓴다. 정상 응답에는 서버가
 * `expiresAt`·`resendAvailableAt`을 직접 주므로 그 값을 그대로 쓴다.
 */
export const VERIFICATION_CODE_TTL_MS = 3 * 60_000;
export const VERIFICATION_RESEND_COOLDOWN_MS = 60_000;

export const verificationChallengeSchema = z.object({
  /** 인증코드 만료 시각. */
  expiresAt: z.iso.datetime(),
  /** 재발송이 가능해지는 시각. 이 전에 재요청하면 `429`가 온다. */
  resendAvailableAt: z.iso.datetime(),
});

export const verificationTokenSchema = z.object({
  /** 해당 이메일·목적에 묶인 일회성 token. 재설정 제출에 함께 보낸다. */
  verificationToken: z.string().min(1),
  /** 발급 시점부터 10분 후. */
  expiresAt: z.iso.datetime(),
});

export type VerificationChallenge = z.infer<typeof verificationChallengeSchema>;
export type VerificationToken = z.infer<typeof verificationTokenSchema>;

/**
 * 인증코드 확인 결과.
 *
 * ⚠️ 계약은 코드 불일치와 만료를 구분하지 않는다 — 둘 다 `400 VALIDATION_ERROR`다.
 * 그래서 서버에서 오는 실패는 `invalid` 하나뿐이고, "만료"는 화면이 자기 카운트다운
 * (`expiresAt`)으로 판단해 제출 자체를 막는다.
 */
export type VerifyCodeOutcome =
  | { status: 'verified'; verificationToken: string; expiresAt: string }
  | { status: 'invalid' };
