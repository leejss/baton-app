import { expect, it } from '@jest/globals';
import { sanitizeLogText, sanitizeRequest } from '@/shared/lib/logSanitizer';

it('중첩 객체와 배열의 민감한 값은 가리고 정상 필드와 원래 전송 본문은 유지한다', () => {
  const input = {
    title: '업무',
    nested: [
      {
        currentPassword: 'pw',
        newPassword: 'new',
        identityToken: 'token',
        emailVerificationToken: 'verification',
        authorizationCode: 'auth-code',
        code: '123456',
        contact: '010-1234-5678',
        displayName: '홍길동',
        email: 'member@example.com',
        count: 3,
      },
    ],
    description: 'member@example.com Bearer credential',
  };
  const body = JSON.stringify(input);
  const result = JSON.parse(sanitizeRequest(body).request ?? 'null');
  expect(result.nested[0]).toEqual({
    currentPassword: '[REDACTED]',
    newPassword: '[REDACTED]',
    identityToken: '[REDACTED]',
    emailVerificationToken: '[REDACTED]',
    authorizationCode: '[REDACTED]',
    code: '[REDACTED]',
    contact: '[REDACTED]',
    displayName: '[REDACTED]',
    email: '[REDACTED]',
    count: 3,
  });
  expect(result.title).toBe('업무');
  expect(result.description).toBe('[REDACTED_EMAIL] Bearer [REDACTED]');
  expect(JSON.stringify(input)).toBe(body);
});

it('정제한 뒤 길이를 제한하며 정제 불가능한 값은 원문 대신 생략한다', () => {
  const result = sanitizeRequest(
    JSON.stringify({ password: 'private', description: 'x'.repeat(6000) }),
  );
  expect(result.request).toHaveLength(4096);
  expect(result.request).not.toContain('private');
  expect(result.requestTruncated).toBe(true);
  expect(sanitizeRequest(undefined)).toEqual({});
  expect(sanitizeRequest('{broken')).toEqual({});
});

it('초대 링크의 URL 토큰을 로그 문구에서 숨긴다', () => {
  expect(sanitizeLogText('초대 링크 baton://workspace/join?token=random_secret')).not.toContain(
    'random_secret',
  );
});
