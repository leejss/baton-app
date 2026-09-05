import { describe, expect, it } from '@jest/globals';

import {
  emailSchema,
  newPasswordFormSchema,
  passwordSchema,
  verificationCodeSchema,
} from '@/features/auth/lib/validation';

/** zod 결과에서 첫 에러 메시지만 꺼낸다. 화면에 그대로 보이는 문구다. */
function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? null : (result.error?.issues[0]?.message ?? null);
}

describe('emailSchema', () => {
  it('앞뒤 공백은 다듬어서 통과시킨다', () => {
    expect(emailSchema.parse('  someone@example.com  ')).toBe('someone@example.com');
  });

  it.each(['', 'not-an-email', 'someone@', '@example.com', 'someone example.com'])(
    '%p 는 거절한다',
    (value) => {
      expect(emailSchema.safeParse(value).success).toBe(false);
    },
  );

  it('빈 값과 형식 오류를 다른 문구로 안내한다', () => {
    expect(firstError(emailSchema.safeParse(''))).toBe('이메일을 입력해주세요.');
    expect(firstError(emailSchema.safeParse('nope'))).toBe('올바른 이메일 형식이 아니에요.');
  });
});

describe('verificationCodeSchema', () => {
  it('숫자 6자리만 통과시킨다', () => {
    expect(verificationCodeSchema.safeParse('123456').success).toBe(true);
  });

  it.each(['12345', '1234567', 'abcdef', '12345a', ''])('%p 는 거절한다', (value) => {
    expect(verificationCodeSchema.safeParse(value).success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('영문·숫자·특수문자를 모두 포함한 8자 이상만 통과시킨다', () => {
    expect(passwordSchema.safeParse('qweb123@').success).toBe(true);
  });

  it('빠진 조건을 각각 짚어 준다', () => {
    expect(firstError(passwordSchema.safeParse('qw1@'))).toBe('8자 이상 입력해주세요.');
    expect(firstError(passwordSchema.safeParse('12345678!'))).toBe('영문을 포함해주세요.');
    expect(firstError(passwordSchema.safeParse('abcdefg!'))).toBe('숫자를 포함해주세요.');
    expect(firstError(passwordSchema.safeParse('abcdefg1'))).toBe('특수문자를 포함해주세요.');
  });
});

describe('newPasswordFormSchema', () => {
  it('두 값이 같아야 통과한다', () => {
    expect(
      newPasswordFormSchema.safeParse({ password: 'qweb123@', confirmation: 'qweb123@' }).success,
    ).toBe(true);
  });

  it('불일치는 확인란 쪽 오류로 붙인다', () => {
    const result = newPasswordFormSchema.safeParse({
      password: 'qweb123@',
      confirmation: 'qweb123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toEqual(['confirmation']);
      expect(issue?.message).toBe('비밀번호가 일치하지 않아요.');
    }
  });
});
