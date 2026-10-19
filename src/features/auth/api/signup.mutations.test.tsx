import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { act, cleanup, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { signUpWithSocial } from '@/features/auth/api/signup.api';
import { isSocialSignupTokenInvalid, useSignUp } from '@/features/auth/api/signup.mutations';
import { AppError } from '@/shared/api/errors';
import { createTestClient } from '@/test/MainTestProvider';
jest.mock('@/features/auth/api/signup.api', () => ({ signUpWithSocial: jest.fn() }));
jest.mock('@/shared/lib/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
beforeEach(() => {
  onlineManager.setOnline(true);
  jest.clearAllMocks();
});
afterEach(cleanup);
it('소셜 가입 mutation은 이메일 입력 없이 전용 API를 호출하고 자동 재시도하지 않는다', async () => {
  const client = createTestClient();
  const failure = new AppError('timeout', '응답을 받지 못했어요');
  jest.mocked(signUpWithSocial).mockRejectedValue(failure);
  const { result } = await renderHook(useSignUp, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  const params = {
    provider: 'kakao' as const,
    socialSignupToken: 'one-time-token',
    displayName: '테스트',
    agreements: [],
  };
  await act(async () => {
    await expect(result.current.mutateAsync(params)).rejects.toBe(failure);
  });
  expect(signUpWithSocial).toHaveBeenCalledTimes(1);
  expect(signUpWithSocial).toHaveBeenCalledWith(params, undefined);
  client.clear();
});
it('만료·소비·대체된 가입 토큰 오류를 재인증으로 구분한다', () => {
  expect(
    isSocialSignupTokenInvalid(
      new AppError('server', '토큰 만료', {
        status: 409,
        errorCode: 'SOCIAL_SIGNUP_TOKEN_INVALID',
      }),
    ),
  ).toBe(true);
  expect(isSocialSignupTokenInvalid(new AppError('network', '연결 실패'))).toBe(false);
});
