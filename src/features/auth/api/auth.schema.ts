import { z } from 'zod';

/**
 * 인증·세션 스키마. 출처는 wiki `openapi.yaml`의 `AuthSessionResponse` 계열이며
 * ADR-026(인증·계정 API 확정)과 ADR-027(역할 기반 기본 프로필 이미지) 기준이다.
 *
 * 여기 있는 건 **확정된 계약**이다. 임의로 필드를 넓히거나 좁히지 않는다 —
 * 서버가 먼저 바뀌고 `openapi.yaml`이 갱신된 뒤에 따라온다.
 */

/** 기본 사진과 사용자 업로드 사진을 모든 프로필·멤버에서 공통으로 사용한다. */
export const staticProfileImageSchema = z.object({
  source: z.literal('STATIC'),
  key: z.enum(['DEFAULT_01', 'DEFAULT_MANAGER', 'DEFAULT_EMPLOYEE']),
});
export const profileImageSchema = z.discriminatedUnion('source', [
  staticProfileImageSchema,
  z.object({ source: z.literal('UPLOADED'), url: z.url() }),
]);

export const userProfileSchema = z.object({
  id: z.number().int().positive(),
  /** 제공자가 전달한 연락 이메일. 계정 식별자는 provider와 subject이며 이메일은 없을 수 있다. */
  email: z.email().nullable(),
  displayName: z.string().min(2).max(20),
  profileImage: profileImageSchema,
  status: z.literal('ACTIVE').nullish(),
});

export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  /** 계약상 발급 후 30분. */
  accessTokenExpiresAt: z.iso.datetime(),
  refreshTokenExpiresAt: z.iso.datetime(),
});

/** 세션은 공간 선택과 독립한다. 공간별 역할은 /workspaces의 참여 목록에서 읽는다. */
export const sessionSchema = z.object({ user: userProfileSchema, tokens: tokenPairSchema });

/**
 * 소셜 인증 응답은 `status`로 갈리는 oneOf다(계약 §12-1).
 * 연결된 계정이 없으면 로그인이 아니라 **가입 대기 token**이 온다.
 */
export const socialAuthenticationSchema = z.discriminatedUnion('status', [
  sessionSchema.extend({ status: z.literal('LOGGED_IN') }),
  z.object({
    status: z.literal('SIGNUP_REQUIRED'),
    /** provider와 provider subject에 묶인 10분 유효·단회 사용 token. */
    socialSignupToken: z.string().min(1),
    expiresAt: z.iso.datetime(),
    /**
     * 제공자가 준 기본값이다. 이메일 입력이나 별도 인증 단계는 두지 않는다.
     *
     * 서버는 값이 없을 때 **`null`을 내려준다**(2026-09-08 실측). `.optional()`은
     * `null`을 거부해 파싱이 통째로 깨지므로 `.nullish()`로 둘 다 받는다.
     */
    suggestedEmail: z.email().nullish(),
    suggestedDisplayName: z.string().nullish(),
  }),
]);

export type ProfileImage = z.infer<typeof profileImageSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type TokenPair = z.infer<typeof tokenPairSchema>;
export type Session = z.infer<typeof sessionSchema>;

/** 소셜 로그인 결과. 신규 소셜 식별자면 가입 화면으로 이어져야 한다. */
export type SocialSignInOutcome =
  | { status: 'signedIn'; session: Session }
  | {
      status: 'signupRequired';
      socialSignupToken: string;
      expiresAt: string;
      suggestedDisplayName?: string;
    };
