import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { EmailLoginScreen } from '@/features/auth/screens/EmailLoginScreen';

/** useSafeAreaInsets는 Provider 없이는 던진다. 시안과 같은 값을 고정으로 주입한다. */
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

/**
 * RNTL 14의 `render`·`fireEvent`는 Promise를 반환한다.
 * await 하지 않으면 `screen`이 비어 있고 act() 경고가 난다.
 */
function renderScreen(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>);
}

describe('EmailLoginScreen', () => {
  it('시안의 문구와 입력 항목을 모두 보여준다', async () => {
    await renderScreen(<EmailLoginScreen />);

    expect(screen.getByText('환영합니다.')).toBeTruthy();
    expect(screen.getByLabelText('이메일')).toBeTruthy();
    expect(screen.getByLabelText('비밀번호')).toBeTruthy();
    expect(screen.getByRole('button', { name: '로그인' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '비밀번호를 잊으셨나요?' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '회원가입' })).toBeTruthy();
  });

  it('이메일과 비밀번호가 모두 채워져야 로그인 버튼이 활성화된다', async () => {
    await renderScreen(<EmailLoginScreen />);

    const submit = screen.getByRole('button', { name: '로그인' });
    expect(submit).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('이메일'), 'someone@example.com');
    expect(submit).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('비밀번호'), 'pw123456');
    expect(submit).toBeEnabled();
  });

  it('비밀번호는 기본으로 가려지고 토글로 드러난다', async () => {
    await renderScreen(<EmailLoginScreen />);

    expect(screen.getByLabelText('비밀번호').props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByRole('button', { name: '비밀번호 보기' }));

    expect(screen.getByLabelText('비밀번호').props.secureTextEntry).toBe(false);
    expect(screen.getByRole('button', { name: '비밀번호 숨기기' })).toBeTruthy();
  });

  it('비밀번호 오류는 안내 문구를 에러 문구로 바꾼다', async () => {
    await renderScreen(
      <EmailLoginScreen passwordError="비밀번호를 다시 확인해주세요. (4/5)" />,
    );

    expect(screen.getByText('비밀번호를 다시 확인해주세요. (4/5)')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '비밀번호를 잊으셨나요?' })).toBeNull();
  });

  it('로그인 제한 중에는 값을 채워도 로그인이 비활성이다', async () => {
    await renderScreen(<EmailLoginScreen lockoutMessage="로그인 제한 02:34" />);

    await fireEvent.changeText(screen.getByLabelText('이메일'), 'someone@example.com');
    await fireEvent.changeText(screen.getByLabelText('비밀번호'), 'pw123456');

    expect(screen.getByText('로그인 제한 02:34')).toBeTruthy();
    expect(screen.getByRole('button', { name: '로그인' })).toBeDisabled();
  });

  it('입력 횟수 초과 알림을 하단에 띄운다', async () => {
    const onAction = jest.fn();

    await renderScreen(
      <EmailLoginScreen
        notice={{
          title: '비밀번호 입력 횟수 초과',
          description: '5분 후 다시 시도해주세요',
          actionLabel: '확인',
          onAction,
        }}
      />,
    );

    expect(screen.getByText('비밀번호 입력 횟수 초과')).toBeTruthy();
    expect(screen.getByText('5분 후 다시 시도해주세요')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: '확인' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('뒤로 가기와 회원가입이 대응하는 핸들러를 호출한다', async () => {
    const onBack = jest.fn();
    const onSignUp = jest.fn();

    await renderScreen(<EmailLoginScreen onBack={onBack} onSignUp={onSignUp} />);

    await fireEvent.press(screen.getByRole('button', { name: '뒤로 가기' }));
    await fireEvent.press(screen.getByRole('button', { name: '회원가입' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onSignUp).toHaveBeenCalledTimes(1);
  });
});
