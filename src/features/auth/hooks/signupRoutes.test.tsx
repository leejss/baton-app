import { afterEach, beforeEach, expect, it } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react-native';
import { ExpoRoot, Stack } from 'expo-router';
import { getMockContext } from 'expo-router/testing-library';
import { Text } from 'react-native';
import SignupLayout from '@/app/(auth)/signup/_layout';
import { useSignupStore } from '@/features/auth/store/signupStore';
const context = getMockContext({
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  start: () => <Text>소셜 로그인 시작</Text>,
  'signup/_layout': SignupLayout,
  'signup/name': () => <Text>닉네임 입력</Text>,
  'signup/terms': () => <Text>약관 동의</Text>,
  'signup/complete': () => <Text>가입 완료</Text>,
});
beforeEach(() => useSignupStore.getState().clear());
afterEach(cleanup);
it.each(['/signup/name', '/signup/terms', '/signup/complete'])(
  '가입 대기 없이 %s에 진입하면 소셜 시작으로 보낸다',
  async (location) => {
    await render(<ExpoRoot context={context} location={location} />);
    expect(await screen.findByText('소셜 로그인 시작')).toBeOnTheScreen();
  },
);
it('가입 대기 토큰이 있으면 이메일 입력 없이 닉네임 단계에 진입한다', async () => {
  useSignupStore.getState().startSocialSignup({
    provider: 'kakao',
    socialSignupToken: 'signup-token',
    expiresAt: new Date(Date.now() + 600000).toISOString(),
  });
  await render(<ExpoRoot context={context} location="/signup/name" />);
  expect(await screen.findByText('닉네임 입력')).toBeOnTheScreen();
});
