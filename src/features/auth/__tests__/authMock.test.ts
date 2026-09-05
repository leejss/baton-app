import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  MAX_SIGN_IN_ATTEMPTS,
  MOCK_VERIFICATION_CODE,
  mockRequestVerificationCode,
  mockSignIn,
  mockVerifyCode,
  resetMockState,
} from '@/features/auth/api/auth.mock';

/**
 * 개발용 목이 기능명세서의 정책 수치를 그대로 들고 있는지 본다.
 * 서버가 붙으면 이 파일과 `auth.mock.ts`를 함께 지운다.
 */
const EMAIL = 'someone@example.com';

beforeEach(() => {
  resetMockState();
});

describe('mockRequestVerificationCode', () => {
  it('유효시간 3분, 재발송 가능 시점 1분으로 발급한다', async () => {
    const before = Date.now();
    const challenge = await mockRequestVerificationCode(EMAIL);

    expect(Date.parse(challenge.expiresAt) - before).toBeGreaterThanOrEqual(3 * 60_000);
    expect(Date.parse(challenge.resendableAt) - before).toBeGreaterThanOrEqual(60_000);
    expect(Date.parse(challenge.resendableAt)).toBeLessThan(Date.parse(challenge.expiresAt));
  });
});

describe('mockVerifyCode', () => {
  it('발송한 적 없는 이메일은 만료로 본다', async () => {
    expect(await mockVerifyCode(EMAIL, MOCK_VERIFICATION_CODE)).toEqual({ status: 'expired' });
  });

  it('코드가 다르면 불일치를 돌려준다', async () => {
    await mockRequestVerificationCode(EMAIL);

    expect(await mockVerifyCode(EMAIL, '000000')).toEqual({ status: 'mismatch' });
  });

  it('맞으면 인증 토큰을 돌려주고 코드를 소진한다', async () => {
    await mockRequestVerificationCode(EMAIL);

    const first = await mockVerifyCode(EMAIL, MOCK_VERIFICATION_CODE);
    expect(first.status).toBe('verified');

    // 한 번 쓴 코드는 다시 통하지 않는다.
    expect(await mockVerifyCode(EMAIL, MOCK_VERIFICATION_CODE)).toEqual({ status: 'expired' });
  });
});

describe('mockSignIn', () => {
  it('성공을 돌려주지 않는다 — 가짜 세션을 만들지 않기 위해서다', async () => {
    const outcome = await mockSignIn();

    expect(outcome.status).not.toBe('signedIn');
  });

  it('실패할 때마다 횟수를 올린다', async () => {
    expect(await mockSignIn()).toMatchObject({ status: 'invalidCredentials', attempts: 1 });
    expect(await mockSignIn()).toMatchObject({ status: 'invalidCredentials', attempts: 2 });
  });

  it('허용 횟수를 다 쓰면 다음 시도부터 제한된다', async () => {
    for (let attempt = 1; attempt < MAX_SIGN_IN_ATTEMPTS; attempt += 1) {
      await mockSignIn();
    }

    // 마지막 실패는 (5/5)로 안내하고, 제한은 그다음 시도부터 걸린다.
    expect(await mockSignIn()).toMatchObject({
      status: 'invalidCredentials',
      attempts: MAX_SIGN_IN_ATTEMPTS,
    });

    const locked = await mockSignIn();
    expect(locked.status).toBe('locked');
    if (locked.status === 'locked') {
      expect(Date.parse(locked.lockedUntil)).toBeGreaterThan(Date.now());
    }
  });
});
