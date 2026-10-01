import { afterEach, expect, it, jest } from '@jest/globals';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { requestVerificationCode } from '@/features/auth/api/passwordReset.api';
import { useRequestSignupCode } from '@/features/auth/api/signup.mutations';
import { AppError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';
import { createTestClient } from '@/test/MainTestProvider';

jest.mock('@/features/auth/api/passwordReset.api', () => ({
  requestVerificationCode: jest.fn(),
  verifyCode: jest.fn(),
}));
jest.mock('@/features/auth/api/signup.api', () => ({
  signUpWithEmail: jest.fn(),
  signUpWithSocial: jest.fn(),
}));
jest.mock('@/shared/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

afterEach(async () => {
  await cleanup();
  jest.clearAllMocks();
});

it.each([
  ['AUTH_ACCOUNT_ALREADY_EXISTS', 409, 'warn'],
  ['SERVICE_UNAVAILABLE', 503, 'error'],
] satisfies [string, number, 'warn' | 'error'][])(
  '가입 인증 %s는 %s 응답을 %s로 분류한다',
  async (errorCode, status, level) => {
    const client = createTestClient();
    const failure = new AppError('server', '실패', { status, errorCode });
    jest.mocked(requestVerificationCode).mockRejectedValue(failure);
    const { result } = await renderHook(() => useRequestSignupCode(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await act(async () => {
      await result.current.mutateAsync({ email: 'test@example.com' }).catch(() => {});
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(logger[level]).toHaveBeenCalledWith(expect.any(String), failure);
    expect(logger[level === 'warn' ? 'error' : 'warn']).not.toHaveBeenCalled();
    client.clear();
  },
);
