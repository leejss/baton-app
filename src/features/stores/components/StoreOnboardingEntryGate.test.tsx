import { afterEach, expect, it } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { StoreOnboardingEntryGate } from '@/features/stores/components/StoreOnboardingEntryGate';
afterEach(cleanup);
it('기존 공간 참여 여부와 상관없이 추가 생성·참여 경로를 연다', async () => {
  await render(
    <StoreOnboardingEntryGate>
      <Text>워크스페이스 생성·참여</Text>
    </StoreOnboardingEntryGate>,
  );
  expect(screen.getByText('워크스페이스 생성·참여')).toBeOnTheScreen();
});
