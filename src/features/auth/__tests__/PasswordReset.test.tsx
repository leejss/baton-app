import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import {
  requestVerificationCode,
  resetPassword,
  verifyCode,
} from '@/features/auth/api/passwordReset.api';
import { PasswordResetCodeScreen } from '@/features/auth/screens/PasswordResetCodeScreen';
import { PasswordResetDoneScreen } from '@/features/auth/screens/PasswordResetDoneScreen';
import { PasswordResetEmailScreen } from '@/features/auth/screens/PasswordResetEmailScreen';
import { PasswordResetNewPasswordScreen } from '@/features/auth/screens/PasswordResetNewPasswordScreen';
import { usePasswordResetStore } from '@/features/auth/store/passwordResetStore';

jest.mock('@/features/auth/api/passwordReset.api', () => ({
  requestVerificationCode: jest.fn(),
  verifyCode: jest.fn(),
  resetPassword: jest.fn(),
}));

const mockRequestCode = jest.mocked(requestVerificationCode);
const mockVerifyCode = jest.mocked(verifyCode);
const mockResetPassword = jest.mocked(resetPassword);

/** useSafeAreaInsets는 Provider 없이는 던진다. 시안과 같은 값을 고정으로 주입한다. */
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

const NOOP = () => {};
const EMAIL = 'someone@example.com';

function renderScreen(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}

/** 인증코드 화면이 기대하는 store 상태를 만들어 준다. */
function seedChallenge({ expiresInMs = 180_000, resendableInMs = 60_000 } = {}) {
  usePasswordResetStore.getState().startChallenge({
    email: EMAIL,
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
    resendableAt: new Date(Date.now() + resendableInMs).toISOString(),
  });
}

beforeEach(() => {
  usePasswordResetStore.getState().clear();
  mockRequestCode.mockReset();
  mockVerifyCode.mockReset();
  mockResetPassword.mockReset();
});

describe('PasswordResetEmailScreen', () => {
  it('이메일 형식이 맞아야 인증번호 받기가 활성화된다', async () => {
    await renderScreen(
      <PasswordResetEmailScreen onBack={NOOP} onBackToSignIn={NOOP} onCodeSent={NOOP} />,
    );

    const submit = screen.getByRole('button', { name: '인증번호 받기' });
    expect(submit).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('이메일'), 'not-an-email');
    await fireEvent(screen.getByLabelText('이메일'), 'blur');
    await waitFor(() => expect(screen.getByText('올바른 이메일 형식이 아니에요.')).toBeTruthy());
    expect(submit).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('이메일'), EMAIL);
    await waitFor(() => expect(submit).toBeEnabled());
  });

  it('발송에 성공하면 만료·재발송 시각을 store에 넣고 다음 화면으로 넘긴다', async () => {
    const expiresAt = new Date(Date.now() + 180_000).toISOString();
    const resendableAt = new Date(Date.now() + 60_000).toISOString();
    mockRequestCode.mockResolvedValue({ expiresAt, resendableAt });
    const onCodeSent = jest.fn();

    await renderScreen(
      <PasswordResetEmailScreen onBack={NOOP} onBackToSignIn={NOOP} onCodeSent={onCodeSent} />,
    );

    await fireEvent.changeText(screen.getByLabelText('이메일'), EMAIL);
    await waitFor(() => expect(screen.getByRole('button', { name: '인증번호 받기' })).toBeEnabled());
    await fireEvent.press(screen.getByRole('button', { name: '인증번호 받기' }));

    await waitFor(() => expect(onCodeSent).toHaveBeenCalledTimes(1));
    expect(usePasswordResetStore.getState().email).toBe(EMAIL);
    expect(usePasswordResetStore.getState().expiresAt).toBe(Date.parse(expiresAt));
  });
});

describe('PasswordResetCodeScreen', () => {
  function renderCodeScreen(props: Partial<{ onVerified: () => void }> = {}) {
    return renderScreen(
      <PasswordResetCodeScreen
        onBack={NOOP}
        onBackToSignIn={NOOP}
        onChangeEmail={NOOP}
        onVerified={props.onVerified ?? NOOP}
      />,
    );
  }

  it('남은 인증 시간을 store의 만료 시각에서 계산해 보여준다', async () => {
    seedChallenge({ expiresInMs: 179_000 });
    await renderCodeScreen();

    expect(screen.getByText('02:59')).toBeTruthy();
  });

  it('6자리를 다 채워야 확인이 활성화된다', async () => {
    seedChallenge();
    await renderCodeScreen();

    const submit = screen.getByRole('button', { name: '확인' });
    expect(submit).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('인증코드'), '12345');
    expect(submit).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('인증코드'), '123456');
    await waitFor(() => expect(submit).toBeEnabled());
  });

  it('재전송은 쿨다운이 끝나기 전에는 눌리지 않는다', async () => {
    seedChallenge({ resendableInMs: 60_000 });
    await renderCodeScreen();

    expect(screen.getByRole('button', { name: '재전송' })).toBeDisabled();
  });

  it('쿨다운이 지났으면 재전송할 수 있다', async () => {
    seedChallenge({ resendableInMs: -1 });
    mockRequestCode.mockResolvedValue({
      expiresAt: new Date(Date.now() + 180_000).toISOString(),
      resendableAt: new Date(Date.now() + 60_000).toISOString(),
    });

    await renderCodeScreen();

    await fireEvent.press(screen.getByRole('button', { name: '재전송' }));

    await waitFor(() =>
      expect(mockRequestCode).toHaveBeenCalledWith(EMAIL, { resend: true }),
    );
  });

  it('코드가 틀리면 문구를 띄우고 넘어가지 않는다', async () => {
    seedChallenge();
    mockVerifyCode.mockResolvedValue({ status: 'mismatch' });
    const onVerified = jest.fn();

    await renderCodeScreen({ onVerified });

    await fireEvent.changeText(screen.getByLabelText('인증코드'), '000000');
    await waitFor(() => expect(screen.getByRole('button', { name: '확인' })).toBeEnabled());
    await fireEvent.press(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.getByText('인증코드가 일치하지 않아요.')).toBeTruthy());
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('인증에 성공하면 토큰을 store에 넣고 다음 화면으로 넘긴다', async () => {
    seedChallenge();
    mockVerifyCode.mockResolvedValue({ status: 'verified', verifyToken: 'token-1' });
    const onVerified = jest.fn();

    await renderCodeScreen({ onVerified });

    await fireEvent.changeText(screen.getByLabelText('인증코드'), '123456');
    await waitFor(() => expect(screen.getByRole('button', { name: '확인' })).toBeEnabled());
    await fireEvent.press(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(onVerified).toHaveBeenCalledTimes(1));
    expect(usePasswordResetStore.getState().verifyToken).toBe('token-1');
  });

  it('인증 시간이 지나면 확인을 막고 재전송을 안내한다', async () => {
    seedChallenge({ expiresInMs: -1, resendableInMs: -1 });
    await renderCodeScreen();

    await fireEvent.changeText(screen.getByLabelText('인증코드'), '123456');

    expect(screen.getByText('인증 시간이 지났어요. 재전송해주세요.')).toBeTruthy();
    expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
  });
});

describe('PasswordResetNewPasswordScreen', () => {
  it('규칙을 만족하고 두 값이 같아야 변경이 활성화된다', async () => {
    await renderScreen(<PasswordResetNewPasswordScreen onBack={NOOP} onChanged={NOOP} />);

    const submit = screen.getByRole('button', { name: '비밀번호 변경하기' });
    const password = screen.getByLabelText('새 비밀번호');
    const confirmation = screen.getByLabelText('새 비밀번호 확인');

    // 특수문자가 없어 규칙 위반.
    await fireEvent.changeText(password, 'qweb1234');
    await fireEvent(password, 'blur');
    await waitFor(() => expect(screen.getByText('특수문자를 포함해주세요.')).toBeTruthy());
    expect(submit).toBeDisabled();

    await fireEvent.changeText(password, 'qweb123@');
    await fireEvent.changeText(confirmation, 'qweb123');
    await fireEvent(confirmation, 'blur');
    await waitFor(() => expect(screen.getByText('비밀번호가 일치하지 않아요.')).toBeTruthy());
    expect(submit).toBeDisabled();

    await fireEvent.changeText(confirmation, 'qweb123@');
    await waitFor(() => expect(submit).toBeEnabled());
  });

  it('인증 토큰과 함께 제출하고 완료 화면으로 넘긴다', async () => {
    seedChallenge();
    usePasswordResetStore.getState().completeVerification('token-1');
    mockResetPassword.mockResolvedValue(undefined);
    const onChanged = jest.fn();

    await renderScreen(<PasswordResetNewPasswordScreen onBack={NOOP} onChanged={onChanged} />);

    await fireEvent.changeText(screen.getByLabelText('새 비밀번호'), 'qweb123@');
    await fireEvent.changeText(screen.getByLabelText('새 비밀번호 확인'), 'qweb123@');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '비밀번호 변경하기' })).toBeEnabled(),
    );
    await fireEvent.press(screen.getByRole('button', { name: '비밀번호 변경하기' }));

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(mockResetPassword).toHaveBeenCalledWith({
      email: EMAIL,
      verifyToken: 'token-1',
      password: 'qweb123@',
    });
  });

  it('두 비밀번호를 각각 따로 보이게 할 수 있다', async () => {
    await renderScreen(<PasswordResetNewPasswordScreen onBack={NOOP} onChanged={NOOP} />);

    const [first] = screen.getAllByRole('button', { name: '비밀번호 보기' });
    await fireEvent.press(first);

    expect(screen.getByLabelText('새 비밀번호').props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText('새 비밀번호 확인').props.secureTextEntry).toBe(true);
  });
});

describe('PasswordResetDoneScreen', () => {
  it('완료 문구와 로그인 이동 버튼을 보여준다', async () => {
    const onGoToSignIn = jest.fn();
    await renderScreen(<PasswordResetDoneScreen onGoToSignIn={onGoToSignIn} />);

    expect(screen.getByText('비밀번호가 변경되었어요!')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: '로그인하러 가기' }));
    expect(onGoToSignIn).toHaveBeenCalledTimes(1);
  });
});
