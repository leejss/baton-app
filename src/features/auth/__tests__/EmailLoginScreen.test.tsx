import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { signInWithEmail } from '@/features/auth/api/auth.api';
import { EmailLoginScreen } from '@/features/auth/screens/EmailLoginScreen';

// 화면 동작만 보려는 테스트라 API는 통째로 대체한다.
// (개발용 목의 실패 횟수·제한 정책 자체는 auth.mock.test.ts에서 따로 본다.)
jest.mock('@/features/auth/api/auth.api', () => ({
  signInWithEmail: jest.fn(),
  exchangeKakaoToken: jest.fn(),
}));

const mockSignIn = jest.mocked(signInWithEmail);

/** useSafeAreaInsets는 Provider 없이는 던진다. 시안과 같은 값을 고정으로 주입한다. */
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

const NOOP = () => {};

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

/** 유효한 값을 채워 로그인 버튼이 눌리는 상태로 만든다. */
async function fillCredentials() {
  await fireEvent.changeText(screen.getByLabelText('이메일'), 'someone@example.com');
  await fireEvent(screen.getByLabelText('이메일'), 'blur');
  await fireEvent.changeText(screen.getByLabelText('비밀번호'), 'pw123456');
  await fireEvent(screen.getByLabelText('비밀번호'), 'blur');
}

describe('EmailLoginScreen', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it('시안의 문구와 입력 항목을 모두 보여준다', async () => {
    await renderScreen(<EmailLoginScreen onBack={NOOP} onForgotPassword={NOOP} />);

    expect(screen.getByText('환영합니다.')).toBeTruthy();
    expect(screen.getByLabelText('이메일')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호')).toBeTruthy();
    expect(screen.getByRole('button', { name: '비밀번호를 잊으셨나요?' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '회원가입' })).toBeTruthy();
  });

  it('이메일 형식이 어긋나면 문구를 띄우고 로그인을 막는다', async () => {
    await renderScreen(<EmailLoginScreen onBack={NOOP} onForgotPassword={NOOP} />);

    await fireEvent.changeText(screen.getByLabelText('이메일'), 'not-an-email');
    await fireEvent(screen.getByLabelText('이메일'), 'blur');

    await waitFor(() => expect(screen.getByText('올바른 이메일 형식이 아니에요.')).toBeTruthy());
    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled();
  });

  it('둘 다 유효해야 로그인이 활성화된다', async () => {
    await renderScreen(<EmailLoginScreen onBack={NOOP} onForgotPassword={NOOP} />);

    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled();

    await fillCredentials();

    await waitFor(() => expect(screen.getByRole('button', { name: '로그인' })).toBeEnabled());
  });

  it('비밀번호가 틀리면 시도 횟수를 붙여 안내한다', async () => {
    mockSignIn.mockResolvedValue({ status: 'invalidCredentials', attempts: 4, maxAttempts: 5 });

    await renderScreen(<EmailLoginScreen onBack={NOOP} onForgotPassword={NOOP} />);
    await fillCredentials();
    await fireEvent.press(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() =>
      expect(screen.getByText('비밀번호를 다시 확인해주세요. (4/5)')).toBeTruthy(),
    );
    // 오류 문구가 "비밀번호를 잊으셨나요?" 자리를 대신한다(시안 01-1).
    expect(screen.queryByRole('button', { name: '비밀번호를 잊으셨나요?' })).toBeNull();
  });

  it('허용 횟수를 다 쓰면 하단 알림까지 띄운다', async () => {
    mockSignIn.mockResolvedValue({ status: 'invalidCredentials', attempts: 5, maxAttempts: 5 });

    await renderScreen(<EmailLoginScreen onBack={NOOP} onForgotPassword={NOOP} />);
    await fillCredentials();
    await fireEvent.press(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(screen.getByText('비밀번호 입력 횟수 초과')).toBeTruthy());
    expect(screen.getByText('5분 후 다시 시도해주세요')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: '확인' }));
    expect(screen.queryByText('비밀번호 입력 횟수 초과')).toBeNull();
  });

  it('로그인 제한 중에는 남은 시간을 보여주고 제출을 막는다', async () => {
    mockSignIn.mockResolvedValue({
      status: 'locked',
      lockedUntil: new Date(Date.now() + 154_000).toISOString(),
    });

    await renderScreen(<EmailLoginScreen onBack={NOOP} onForgotPassword={NOOP} />);
    await fillCredentials();
    await fireEvent.press(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(screen.getByText('로그인 제한 02:34')).toBeTruthy());
    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled();
  });

  it('비밀번호는 기본으로 가려지고 토글로 드러난다', async () => {
    await renderScreen(<EmailLoginScreen onBack={NOOP} onForgotPassword={NOOP} />);

    expect(screen.getByLabelText('비밀번호').props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByRole('button', { name: '비밀번호 보기' }));

    expect(screen.getByLabelText('비밀번호').props.secureTextEntry).toBe(false);
  });

  it('뒤로 가기·회원가입·비밀번호 찾기가 대응하는 핸들러를 호출한다', async () => {
    const onBack = jest.fn();
    const onSignUp = jest.fn();
    const onForgotPassword = jest.fn();

    await renderScreen(
      <EmailLoginScreen onBack={onBack} onSignUp={onSignUp} onForgotPassword={onForgotPassword} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: '뒤로 가기' }));
    await fireEvent.press(screen.getByRole('button', { name: '회원가입' }));
    await fireEvent.press(screen.getByRole('button', { name: '비밀번호를 잊으셨나요?' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onSignUp).toHaveBeenCalledTimes(1);
    expect(onForgotPassword).toHaveBeenCalledTimes(1);
  });
});
