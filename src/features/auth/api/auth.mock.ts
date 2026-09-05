/**
 * ⚠️ 개발용 가짜 서버. `EXPO_PUBLIC_API_URL`이 비어 있을 때만 쓰인다.
 *
 * 백엔드가 붙으면 **이 파일을 지우고** 각 api 모듈에서 `USE_MOCK` 분기를 걷어내면 된다.
 * 그때까지 화면 플로우와 시안의 상태 변형을 실제로 눌러볼 수 있게 하는 것이 목적이다.
 *
 * 세션(로그인 성공)은 절대 만들지 않는다. 가짜 세션을 저장해 두면 그 위에 다른 화면을
 * 쌓게 되고 진짜 서버가 붙을 때 전부 다시 손대야 한다 — `auth.api.ts`가 세운 원칙과 같다.
 */
import type { VerificationChallenge, VerifyCodeOutcome } from '@/features/auth/api/passwordReset.schema';

/** 정책(`기능명세서_BATON` AUTH-04): 인증코드 유효시간 3분. */
const CODE_TTL_MS = 3 * 60_000;
/** 정책(AUTH-05): 직전 발송 후 1분 경과해야 재발송 가능. */
const RESEND_COOLDOWN_MS = 60_000;
/** 시안 01-2 "5분 후 다시 시도해주세요". */
const LOCKOUT_MS = 5 * 60_000;

/** 시안에 쓰인 값. 이 코드만 통과시켜 성공·불일치 두 경로를 다 눌러볼 수 있게 한다. */
export const MOCK_VERIFICATION_CODE = '123456';

/** 로그인 실패 허용 횟수. 시안의 "(n/5)" 표기와 같다. */
export const MAX_SIGN_IN_ATTEMPTS = 5;

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

export async function mockRequestVerificationCode(email: string): Promise<VerificationChallenge> {
  await delay();

  const now = Date.now();
  state.challenges.set(email, now + CODE_TTL_MS);

  return {
    expiresAt: new Date(now + CODE_TTL_MS).toISOString(),
    resendableAt: new Date(now + RESEND_COOLDOWN_MS).toISOString(),
  };
}

export async function mockVerifyCode(email: string, code: string): Promise<VerifyCodeOutcome> {
  await delay();

  const expiresAt = state.challenges.get(email);
  if (expiresAt === undefined || Date.now() > expiresAt) {
    return { status: 'expired' };
  }

  if (code !== MOCK_VERIFICATION_CODE) {
    return { status: 'mismatch' };
  }

  state.challenges.delete(email);
  return { status: 'verified', verifyToken: `mock-verify-token-${email}` };
}

export async function mockResetPassword(): Promise<void> {
  await delay();
}

export type MockSignInOutcome =
  | { status: 'invalidCredentials'; attempts: number; maxAttempts: number }
  | { status: 'locked'; lockedUntil: string };

/**
 * 항상 실패한다. 서버 없이 비밀번호를 검증할 방법이 없기도 하고,
 * 성공시키면 가짜 세션이 생겨서다. 대신 시안의 오류 상태 3종을 모두 거치게 만든다.
 */
export async function mockSignIn(): Promise<MockSignInOutcome> {
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

  state.signInAttempts += 1;

  if (state.signInAttempts >= MAX_SIGN_IN_ATTEMPTS) {
    state.lockedUntil = now + LOCKOUT_MS;
  }

  return {
    status: 'invalidCredentials',
    attempts: state.signInAttempts,
    maxAttempts: MAX_SIGN_IN_ATTEMPTS,
  };
}

/** 테스트에서 상태를 격리하려고 쓴다. */
export function resetMockState() {
  state.challenges.clear();
  state.signInAttempts = 0;
  state.lockedUntil = null;
}
