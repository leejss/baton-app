import { MAX_SIGN_IN_ATTEMPTS } from '@/features/auth/api/auth.schema';

export type SignInAttemptState = {
  /** 화면이 들고 있을 누적 실패 횟수. `MAX_SIGN_IN_ATTEMPTS`를 넘지 않는다. */
  attempts: number;
  /** 비밀번호 필드 아래 빨간 문구. 시안 01-1·01-2의 "(n/5)". */
  message: string;
  /** 하단 "비밀번호 입력 횟수 초과" 스낵바를 띄울지. */
  isLimitReached: boolean;
};

/**
 * 비밀번호 실패를 한 번 더 센 안내 상태.
 *
 * 횟수는 서버가 아니라 화면이 로컬로 센다 — 계약의 `401 AUTH_INVALID_CREDENTIALS`가
 * 횟수를 싣지 않는다. 서버가 5회에서 잠그면 그다음 시도는 `429`로 와서 이 함수를
 * 타지 않지만, 잠금이 늦거나 없으면 `401`이 계속 도착해 카운터만 올라간다.
 * 그 상태로 QA 빌드 12에서 "(7/5)"가 사용자에게 보였다. 그래서 상한을 둔다 —
 * 분모를 넘는 분자는 어떤 경우에도 문구로 나가지 않는다.
 */
export function nextSignInAttempt(previousAttempts: number): SignInAttemptState {
  const attempts = Math.min(previousAttempts + 1, MAX_SIGN_IN_ATTEMPTS);

  return {
    attempts,
    message: `비밀번호를 다시 확인해주세요. (${attempts}/${MAX_SIGN_IN_ATTEMPTS})`,
    isLimitReached: attempts >= MAX_SIGN_IN_ATTEMPTS,
  };
}
