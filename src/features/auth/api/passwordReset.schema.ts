import { z } from 'zod';

/**
 * ⚠️ 백엔드가 아직 없다. 여기 스키마는 **합의된 계약이 아니라 프론트가 제안하는 형태**다.
 *
 * `기능명세서_BATON`(AUTH-04~06)이 제시한 엔드포인트를 기준으로 잡았고,
 * 명세에 없는 두 가지는 프론트가 필요해서 추가한 것이라 따로 표시해 둔다.
 *
 *   POST /auth/email/code         { email, resend }          → { expiresAt, resendableAt }
 *   POST /auth/email/code/verify  { email, code }            → { verifyToken }
 *   POST /auth/password/reset     { email, verifyToken, password } → 204
 *
 * - `resendableAt`: 명세에 "직전 발송 후 1분 경과" 정책만 있고 응답 필드는 없다.
 *   클라이언트가 1분을 자체 계산하면 서버 시계와 어긋나므로 서버가 내려주길 제안한다.
 * - `/auth/password/reset`: 비밀번호 재설정은 기능명세서에 아예 없다(확인 필요 #4).
 *   시안 03~04 플로우를 돌리려면 필요해서 제안한다.
 */

export const verificationChallengeSchema = z.object({
  /** 인증코드 만료 시각. 정책상 발송 + 3분. */
  expiresAt: z.iso.datetime(),
  /** 재발송이 가능해지는 시각. 정책상 발송 + 1분. */
  resendableAt: z.iso.datetime(),
});

export const verificationResultSchema = z.object({
  /** 이후 비밀번호 재설정·회원가입 제출에 함께 보내는 단기 토큰. */
  verifyToken: z.string().min(1),
});

export type VerificationChallenge = z.infer<typeof verificationChallengeSchema>;
export type VerificationResult = z.infer<typeof verificationResultSchema>;

/**
 * 인증코드 확인 결과. 불일치·만료는 "예외"가 아니라 **정상적으로 일어나는 결과**라
 * throw 하지 않고 판별 가능한 union으로 돌려준다. 네트워크 실패 같은 진짜 예외만 throw 한다.
 */
export type VerifyCodeOutcome =
  | { status: 'verified'; verifyToken: string }
  | { status: 'mismatch' }
  | { status: 'expired' };
