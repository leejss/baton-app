import { describe, expect, it } from '@jest/globals';

import { redirectSystemPath } from '@/app/+native-intent';

const KAKAO_CALLBACK = 'kakao0123456789abcdef0123456789abcdef://oauth';

describe.each([true, false])('외부 URL 처리 (initial=%s)', (initial) => {
  it.each([
    KAKAO_CALLBACK,
    `${KAKAO_CALLBACK}?code=test-code&state=test-state`,
    `${KAKAO_CALLBACK}?error=access_denied`,
  ])('카카오 인증 콜백으로 화면을 이동하지 않는다: %s', (path) => {
    expect(redirectSystemPath({ path, initial })).toBeNull();
  });

  it.each([
    '/start',
    '/login',
    '/signup/name',
    'baton-dev://home',
    'baton-preview://handoffs/42',
    'baton://store',
    'baton://oauth?code=test-code',
    'https://example.com/oauth?code=test-code',
    'kakao0123456789abcdef0123456789abcdef://handoffs/42',
    'not a URL',
    '',
  ])('카카오 인증 콜백이 아닌 경로는 유지한다: %s', (path) => {
    expect(redirectSystemPath({ path, initial })).toBe(path);
  });
});
