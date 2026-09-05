import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { StartScreen } from '@/features/auth/screens/StartScreen';

// 네이티브 모듈이라 테스트 환경에 없다. 화면은 SDK를 직접 부르지 않고 래퍼를 거치지만,
// import 체인은 여전히 닿으므로 모듈 자체를 대체한다.
jest.mock('@react-native-seoul/kakao-login', () => ({
  login: jest.fn(),
  logout: jest.fn(),
}));

/** useSafeAreaInsets는 Provider 없이는 던진다. 실기기와 같은 값을 고정으로 주입한다. */
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

/**
 * RNTL 14의 `render`·`fireEvent`는 Promise를 반환한다.
 * await 하지 않으면 `screen`이 비어 있고 act() 경고가 난다.
 */
function renderScreen(ui: ReactElement) {
  // retry를 켜두면 실패 케이스 테스트가 타임아웃난다.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}

describe('StartScreen', () => {
  it('로그인 수단 세 가지를 보여준다', async () => {
    await renderScreen(<StartScreen />);

    expect(screen.getByRole('button', { name: '카카오로 시작하기' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Apple로 시작하기' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '이메일로 시작하기' })).toBeTruthy();
    expect(screen.getByText('근무자는 바뀌어도 업무는 끊기지 않게')).toBeTruthy();
  });

  it('각 버튼이 대응하는 핸들러를 호출한다', async () => {
    const onStartWithKakao = jest.fn();
    const onStartWithApple = jest.fn();
    const onStartWithEmail = jest.fn();

    await renderScreen(
      <StartScreen
        onStartWithKakao={onStartWithKakao}
        onStartWithApple={onStartWithApple}
        onStartWithEmail={onStartWithEmail}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: '카카오로 시작하기' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Apple로 시작하기' }));
    await fireEvent.press(screen.getByRole('button', { name: '이메일로 시작하기' }));

    expect(onStartWithKakao).toHaveBeenCalledTimes(1);
    expect(onStartWithApple).toHaveBeenCalledTimes(1);
    expect(onStartWithEmail).toHaveBeenCalledTimes(1);
  });
});
