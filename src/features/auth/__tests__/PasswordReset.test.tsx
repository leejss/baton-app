import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { PasswordResetCodeScreen } from '@/features/auth/screens/PasswordResetCodeScreen';
import { PasswordResetDoneScreen } from '@/features/auth/screens/PasswordResetDoneScreen';
import { PasswordResetEmailScreen } from '@/features/auth/screens/PasswordResetEmailScreen';
import { PasswordResetNewPasswordScreen } from '@/features/auth/screens/PasswordResetNewPasswordScreen';

/** useSafeAreaInsets는 Provider 없이는 던진다. 시안과 같은 값을 고정으로 주입한다. */
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

function renderScreen(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>);
}

describe('PasswordResetEmailScreen', () => {
  it('이메일을 입력해야 인증번호 받기가 활성화된다', async () => {
    await renderScreen(<PasswordResetEmailScreen />);

    expect(screen.getByText('비밀번호 재설정')).toBeTruthy();

    const submit = screen.getByRole('button', { name: '인증번호 받기' });
    expect(submit).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('이메일'), 'someone@example.com');
    expect(submit).toBeEnabled();
  });

  it('로그인 화면으로 돌아가기가 핸들러를 호출한다', async () => {
    const onBackToSignIn = jest.fn();
    await renderScreen(<PasswordResetEmailScreen onBackToSignIn={onBackToSignIn} />);

    await fireEvent.press(screen.getByRole('button', { name: '로그인 화면으로 돌아가기' }));

    expect(onBackToSignIn).toHaveBeenCalledTimes(1);
  });
});

describe('PasswordResetCodeScreen', () => {
  it('6자리를 다 채워야 확인이 활성화된다', async () => {
    await renderScreen(<PasswordResetCodeScreen timeLeft="02:59" />);

    expect(screen.getByText('02:59')).toBeTruthy();

    const submit = screen.getByRole('button', { name: '확인' });
    expect(submit).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('인증코드'), '12345');
    expect(submit).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('인증코드'), '123456');
    expect(submit).toBeEnabled();
  });

  it('재전송과 이메일 다시 입력하기가 각각의 핸들러를 부른다', async () => {
    const onResend = jest.fn();
    const onChangeEmail = jest.fn();

    await renderScreen(
      <PasswordResetCodeScreen onResend={onResend} onChangeEmail={onChangeEmail} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: '재전송' }));
    await fireEvent.press(screen.getByRole('button', { name: '이메일 다시 입력하기' }));

    expect(onResend).toHaveBeenCalledTimes(1);
    expect(onChangeEmail).toHaveBeenCalledTimes(1);
  });
});

describe('PasswordResetNewPasswordScreen', () => {
  it('8자 이상이고 두 값이 같아야 변경이 활성화된다', async () => {
    await renderScreen(<PasswordResetNewPasswordScreen />);

    const submit = screen.getByRole('button', { name: '비밀번호 변경하기' });
    const password = screen.getByLabelText('새 비밀번호');
    const confirmation = screen.getByLabelText('새 비밀번호 확인');

    await fireEvent.changeText(password, 'qweb123@');
    expect(submit).toBeDisabled();

    await fireEvent.changeText(confirmation, 'qweb123');
    expect(submit).toBeDisabled();

    await fireEvent.changeText(confirmation, 'qweb123@');
    expect(submit).toBeEnabled();
  });

  it('두 비밀번호를 각각 따로 보이게 할 수 있다', async () => {
    await renderScreen(<PasswordResetNewPasswordScreen />);

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
