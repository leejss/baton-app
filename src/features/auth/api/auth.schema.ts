import { z } from 'zod';

/**
 * 인증·세션 스키마. 출처는 wiki `openapi.yaml`의 `AuthSessionResponse` 계열이며
 * ADR-026(인증·계정 API 확정)과 ADR-027(역할 기반 기본 프로필 이미지) 기준이다.
 *
 * 여기 있는 건 **확정된 계약**이다. 임의로 필드를 넓히거나 좁히지 않는다 —
 * 서버가 먼저 바뀌고 `openapi.yaml`이 갱신된 뒤에 따라온다.
 */

/**
 * 프로필 이미지는 업로드가 아니라 **활성 역할에서 파생되는 정적 값**이다(ADR-027).
 * URL이 아니라 key라서 만료가 없고, 매장 참여·나가기·관리자 승계 후 자동으로 바뀐다.
 * 앱은 이 세 key를 번들 이미지에 매핑한다.
 */
export const profileImageSchema = z.object({
  source: z.literal('STATIC'),
  key: z.enum(['DEFAULT_01', 'DEFAULT_MANAGER', 'DEFAULT_EMPLOYEE']),
});

export const userProfileSchema = z.object({
  id: z.number().int().positive(),
  /** 일반·소셜 계정 공통의 정규화된 계정 식별자. */
  email: z.email(),
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

export const storeSchema = z.object({
  id: z.number().int().positive(),
  storeName: z.string().min(2).max(50),
  branchName: z.string().min(1),
  address: z.string().min(1),
  detailAddress: z.string().nullish(),
  storeContact: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  createdAt: z.iso.datetime(),
  deactivatedAt: z.iso.datetime().nullish(),
});

export const membershipContextSchema = z.object({
  store: storeSchema,
  role: z.enum(['MANAGER', 'EMPLOYEE']),
  status: z.enum(['ACTIVE', 'LEFT']),
});

/**
 * 활성 매장 소속이 없을 때의 `membership`.
 *
 * 계약(`openapi.yaml`)은 "생략된다"고 읽히지만 **개발 서버는 `null`을 내려준다**
 * (2026-09-08 실측: `GET /stores/me` → `{"membership":null}`).
 * `.optional()`은 `null`을 거부하므로 소속 없는 사용자가 로그인하면 파싱이 깨진다.
 * 둘 다 받도록 `.nullish()`로 둔다 — 어느 쪽이 오든 앱은 "소속 없음"으로 해석한다.
 */
export const sessionSchema = z.object({
  user: userProfileSchema,
  tokens: tokenPairSchema,
  membership: membershipContextSchema.nullish(),
});

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
     * 제공자가 준 수정 가능한 기본값. Baton 이메일 인증을 대체하지 않는다.
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
export type MembershipContext = z.infer<typeof membershipContextSchema>;
export type Session = z.infer<typeof sessionSchema>;

/** 계약상 연속 5회 실패 시 5분 제한. 서버가 기준이고 앱은 안내 문구에만 쓴다. */
export const MAX_SIGN_IN_ATTEMPTS = 5;

/**
 * 이메일 로그인 결과.
 *
 * 계약은 실패를 `401 AUTH_INVALID_CREDENTIALS` / `429 AUTH_LOGIN_TEMPORARILY_LOCKED`로 내린다.
 * 둘 다 화면에서는 **정상적으로 일어나는 결과**라 throw 하지 않고 union으로 돌려준다.
 * 네트워크 실패 같은 진짜 예외만 throw 한다.
 *
 * ⚠️ 시안의 "(n/5)" 시도 횟수는 계약 응답에 없다. 서버가 401에 횟수를 싣지 않으므로
 * 화면이 로컬로 센다 — 앱을 다시 켜면 0부터다. 서버가 필드를 주면 그때 옮긴다.
 */
export type SignInOutcome =
  | { status: 'signedIn'; session: Session }
  | { status: 'invalidCredentials' }
  | { status: 'locked'; lockedUntil: string };

/** 소셜 로그인 결과. 신규 소셜 식별자면 가입 화면으로 이어져야 한다. */
export type SocialSignInOutcome =
  | { status: 'signedIn'; session: Session }
  | {
      status: 'signupRequired';
      socialSignupToken: string;
      expiresAt: string;
      suggestedEmail?: string;
      suggestedDisplayName?: string;
    };
