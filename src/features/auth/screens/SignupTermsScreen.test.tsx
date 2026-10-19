import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { Alert } from 'react-native';
import type { Session } from '@/features/auth/api/auth.schema';
import { signUpWithSocial } from '@/features/auth/api/signup.api';
import { SignupTermsScreen } from '@/features/auth/screens/SignupTermsScreen';
import { useSignupStore } from '@/features/auth/store/signupStore';
import { AppError } from '@/shared/api/errors';
import { createTestClient, MainTestProvider, TEST_CONTEXT } from '@/test/MainTestProvider';
jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);
jest.mock('@/features/auth/api/signup.api', () => ({ signUpWithSocial: jest.fn() }));
jest.mock('@/shared/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
const session: Session = {
  user: { ...TEST_CONTEXT.profile, email: null },
  tokens: {
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
    accessTokenExpiresAt: '2026-10-20T12:00:00Z',
    refreshTokenExpiresAt: '2026-11-20T12:00:00Z',
  },
};
let client = createTestClient();
const onComplete = jest.fn();
const onSignIn = jest.fn();
const onExpired = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  onlineManager.setOnline(true);
  client = createTestClient();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  useSignupStore.getState().startSocialSignup({
    provider: 'kakao',
    socialSignupToken: 'one-time-token',
    expiresAt: new Date(Date.now() + 600000).toISOString(),
  });
  useSignupStore.getState().setDisplayName('테스트');
  useSignupStore.getState().setAgreement('TERMS_OF_SERVICE', true);
  useSignupStore.getState().setAgreement('PRIVACY_COLLECTION_USE', true);
  jest.mocked(signUpWithSocial).mockResolvedValue(session);
});
afterEach(async () => {
  await cleanup();
  client.clear();
  useSignupStore.getState().clear();
  jest.restoreAllMocks();
});
const mount = () =>
  render(
    <MainTestProvider client={client}>
      <SignupTermsScreen
        onBack={jest.fn()}
        onComplete={onComplete}
        onSocialSignupExpired={onExpired}
        onSignIn={onSignIn}
      />
    </MainTestProvider>,
  );
it('이메일 확인 없이 닉네임·약관만으로 가입을 완료한다', async () => {
  await mount();
  await fireEvent.press(screen.getByRole('button', { name: '다음' }));
  await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  expect(signUpWithSocial).toHaveBeenCalledWith(
    expect.objectContaining({
      provider: 'kakao',
      socialSignupToken: 'one-time-token',
      displayName: '테스트',
      agreements: expect.any(Array),
    }),
    expect.any(AbortSignal),
  );
  expect(jest.mocked(signUpWithSocial).mock.calls[0][0]).not.toHaveProperty('email');
  expect(useSignupStore.getState().pendingSession).toEqual(session);
});
it('중복 제출을 막고 이탈 뒤 늦은 성공을 로그인 상태로 반영하지 않는다', async () => {
  let finish!: (session: Session) => void;
  jest.mocked(signUpWithSocial).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await mount();
  const button = screen.getByRole('button', { name: '다음' });
  await fireEvent.press(button);
  await fireEvent.press(button);
  expect(signUpWithSocial).toHaveBeenCalledTimes(1);
  await screen.unmount();
  await act(async () => finish(session));
  expect(onComplete).not.toHaveBeenCalled();
  expect(useSignupStore.getState().pendingSession).toBeNull();
});
it('만료된 소셜 토큰은 가입 요청을 보내지 않고 재인증을 안내한다', async () => {
  useSignupStore.setState({ socialSignupExpiresAt: Date.now() - 1 });
  await mount();
  await fireEvent.press(screen.getByRole('button', { name: '소셜 인증 다시 하기' }));
  expect(signUpWithSocial).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith(
    '소셜 인증을 다시 해주세요',
    expect.any(String),
    expect.any(Array),
  );
});
it('가입 결과를 받지 못하면 같은 토큰으로 재제출하지 않고 소셜 로그인으로 확인한다', async () => {
  jest.mocked(signUpWithSocial).mockRejectedValue(new AppError('timeout', '응답 유실'));
  await mount();
  await fireEvent.press(screen.getByRole('button', { name: '다음' }));
  await waitFor(() => expect(useSignupStore.getState().submissionUncertain).toBe(true));
  await fireEvent.press(await screen.findByRole('button', { name: '소셜 로그인으로 확인' }));
  await waitFor(() => expect(onSignIn).toHaveBeenCalledTimes(1));
  expect(signUpWithSocial).toHaveBeenCalledTimes(1);
});
