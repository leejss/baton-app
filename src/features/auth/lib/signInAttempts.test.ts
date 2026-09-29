import { expect, it } from '@jest/globals';

import { MAX_SIGN_IN_ATTEMPTS } from '@/features/auth/api/auth.schema';
import { nextSignInAttempt } from '@/features/auth/lib/signInAttempts';

it('실패할 때마다 횟수를 한 칸 올려 문구로 만든다', () => {
  expect(nextSignInAttempt(0)).toEqual({
    attempts: 1,
    message: '비밀번호를 다시 확인해주세요. (1/5)',
    isLimitReached: false,
  });
  expect(nextSignInAttempt(3).message).toBe('비밀번호를 다시 확인해주세요. (4/5)');
});

it('상한에 닿으면 스낵바를 띄운다', () => {
  const state = nextSignInAttempt(MAX_SIGN_IN_ATTEMPTS - 1);

  expect(state.attempts).toBe(MAX_SIGN_IN_ATTEMPTS);
  expect(state.message).toBe('비밀번호를 다시 확인해주세요. (5/5)');
  expect(state.isLimitReached).toBe(true);
});

it('서버 잠금이 늦어 401이 계속 와도 분모를 넘지 않는다', () => {
  // 잠금 없이 6·7번째 실패가 들어온 상황(QA 빌드 12의 "(7/5)").
  for (const previous of [MAX_SIGN_IN_ATTEMPTS, MAX_SIGN_IN_ATTEMPTS + 2]) {
    const state = nextSignInAttempt(previous);

    expect(state.attempts).toBe(MAX_SIGN_IN_ATTEMPTS);
    expect(state.message).toBe('비밀번호를 다시 확인해주세요. (5/5)');
    expect(state.isLimitReached).toBe(true);
  }
});
