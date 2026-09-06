import { API_URL } from '@/shared/api/client';

import type { Session, SignInOutcome, SocialSignInOutcome } from '@/features/auth/api/auth.schema';
import { MAX_SIGN_IN_ATTEMPTS } from '@/features/auth/api/auth.schema';
import type {
  VerificationChallenge,
  VerifyCodeOutcome,
} from '@/features/auth/api/passwordReset.schema';

/**
 * ⚠️ 개발용 가짜 서버. **백엔드 인프라가 아직 배포되지 않아** 임시로 쓴다.
 *
 * 서버가 뜨면 이 파일을 지우고 각 api 모듈의 `USE_MOCK_AUTH` 분기를 걷어낸다.
 * 그때까지 화면 플로우와 시안의 상태 변형을 실제로 눌러볼 수 있게 하는 것이 목적이다.
 *
 * 여기서 만드는 값은 전부 확정 계약(wiki `openapi.yaml`, ADR-026)의 형태를 그대로 따른다.
 * 형태가 서버와 같아야 실제 연동 때 화면을 다시 손대지 않는다.
 */

/**
 * 목을 쓸지 여부.
 *
 * 서버 주소가 없으면 자동으로 켜지므로, `.env`에 주소를 넣는 순간 목이 꺼진다.
 * 주소가 있어도 강제로 목을 쓰려면 `EXPO_PUBLIC_USE_MOCK_AUTH=true`.
 */
export const USE_MOCK_AUTH = API_URL === '' || process.env.EXPO_PUBLIC_USE_MOCK_AUTH === 'true';

/** 정책(AUTH-04): 인증코드 유효시간 3분. */
const CODE_TTL_MS = 3 * 60_000;
/** 정책(AUTH-05): 직전 발송 후 1분 경과해야 재발송 가능. */
const RESEND_COOLDOWN_MS = 60_000;
/** 계약: 연속 5회 실패 시 5분 제한. */
const LOCKOUT_MS = 5 * 60_000;

/** 시안에 쓰인 값. 이 코드만 통과시켜 성공·실패 두 경로를 다 눌러볼 수 있게 한다. */
export const MOCK_VERIFICATION_CODE = '123456';

/**
 * 이 계정으로만 로그인이 성공한다. 비밀번호는 형식만 맞으면 통과다.
 * 나머지 이메일은 전부 실패시켜 시안의 오류 상태 3종을 눌러볼 수 있게 한다.
 */
export const MOCK_SIGN_IN_EMAIL = 'test@baton.dev';

/** 화면 사이에 유지돼야 해서 모듈 스코프에 둔다. 앱을 다시 켜면 초기화된다. */
const state = {
  /** 이메일별 인증코드 만료 시각. */
  challenges: new Map<string, number>(),
  signInAttempts: 0,
  lockedUntil: null as number | null,
};

/** 네트워크가 있는 것처럼 보이도록 살짝 늦춘다. 로딩 상태가 화면에서 실제로 보인다. */
function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isoIn(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

/**
 * 계약의 `AuthSessionResponse` 와 같은 형태를 만든다.
 *
 * 가짜 토큰이라 실제 요청에는 쓸 수 없다 — 목이 켜진 동안에는 인증이 필요한 요청도
 * 어차피 서버로 나가지 않는다. 형태만 서버와 같으면 화면은 진짜와 구분하지 못한다.
 */
function createSession(email: string, displayName = '김지원'): Session {
  return {
    user: {
      id: 1,
      email,
      displayName,
      profileImage: { source: 'STATIC', key: 'DEFAULT_01' },
    },
    tokens: {
      accessToken: `mock-access-token-${Date.now()}`,
      refreshToken: 'mock-refresh-token',
      /** 계약상 30분. */
      accessTokenExpiresAt: isoIn(30 * 60_000),
      refreshTokenExpiresAt: isoIn(30 * 24 * 60 * 60_000),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 이메일 로그인
// ─────────────────────────────────────────────────────────────

export async function mockSignIn(email: string): Promise<SignInOutcome> {
  await delay();

  const now = Date.now();

  if (state.lockedUntil !== null) {
    if (now < state.lockedUntil) {
      return { status: 'locked', lockedUntil: new Date(state.lockedUntil).toISOString() };
    }
    // 제한이 풀렸으면 횟수를 리셋하고 처음부터 다시 센다.
    state.lockedUntil = null;
    state.signInAttempts = 0;
  }

  if (email === MOCK_SIGN_IN_EMAIL) {
    state.signInAttempts = 0;
    return { status: 'signedIn', session: createSession(email) };
  }

  state.signInAttempts += 1;
  if (state.signInAttempts >= MAX_SIGN_IN_ATTEMPTS) {
    state.lockedUntil = now + LOCKOUT_MS;
  }

  return { status: 'invalidCredentials' };
}

// ─────────────────────────────────────────────────────────────
// 소셜 로그인
// ─────────────────────────────────────────────────────────────

/**
 * 카카오 SDK 로그인(`signInWithKakao`)은 목이 아니라 **실제로 동작한다** — 앱 키가 있고
 * 카카오 서버만 있으면 되기 때문이다. 목이 대신하는 건 그 뒤의 서버 토큰 교환뿐이다.
 *
 * 계약이 로그인/가입대기 두 갈래라(§12-1) 어느 쪽을 볼지 env로 고른다:
 *   EXPO_PUBLIC_MOCK_SOCIAL_OUTCOME=signupRequired   신규 가입 플로우 확인용
 *   (기본값)                                          기존 계정 로그인
 */
export async function mockAuthenticateSocial(): Promise<SocialSignInOutcome> {
  await delay();

  if (process.env.EXPO_PUBLIC_MOCK_SOCIAL_OUTCOME === 'signupRequired') {
    return {
      status: 'signupRequired',
      socialSignupToken: `mock-social-signup-token-${Date.now()}`,
      /** 계약상 10분 유효. */
      expiresAt: isoIn(10 * 60_000),
      suggestedEmail: 'kakao-user@example.com',
      suggestedDisplayName: '김지원',
    };
  }

  return { status: 'signedIn', session: createSession('kakao-user@example.com') };
}

// ─────────────────────────────────────────────────────────────
// 이메일 인증 · 비밀번호 재설정
// ─────────────────────────────────────────────────────────────

export async function mockRequestVerificationCode(email: string): Promise<VerificationChallenge> {
  await delay();

  state.challenges.set(email, Date.now() + CODE_TTL_MS);

  return {
    expiresAt: isoIn(CODE_TTL_MS),
    resendAvailableAt: isoIn(RESEND_COOLDOWN_MS),
  };
}

export async function mockVerifyCode(email: string, code: string): Promise<VerifyCodeOutcome> {
  await delay();

  // 계약은 불일치와 만료를 구분하지 않는다 — 둘 다 400이다. 목도 같게 맞춘다.
  const expiresAt = state.challenges.get(email);
  if (expiresAt === undefined || Date.now() > expiresAt || code !== MOCK_VERIFICATION_CODE) {
    return { status: 'invalid' };
  }

  state.challenges.delete(email);
  return {
    status: 'verified',
    verificationToken: `mock-verification-token-${email}`,
    /** 계약상 발급 후 10분. */
    expiresAt: isoIn(10 * 60_000),
  };
}

export async function mockResetPassword(): Promise<void> {
  await delay();
}
