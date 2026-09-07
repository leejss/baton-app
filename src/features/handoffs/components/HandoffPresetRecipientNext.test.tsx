import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HandoffPresetRecipientNext } from '@/features/handoffs/components/HandoffPresetRecipientNext';
import { useHandoffDraftStore } from '@/features/handoffs/model/handoffDraftStore';

const clients: QueryClient[] = [];
const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, right: 0, bottom: 34, left: 0 },
};
afterEach(async () => {
  await cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  useHandoffDraftStore.getState().reset();
});

it('근무표의 직원 식별자를 조회하고 다음 버튼을 누를 때 수신자로 확정한다', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  clients.push(client);
  const onNext = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={client}>
        <HandoffPresetRecipientNext recipientId="2" onNext={onNext} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  expect(await screen.findByText('받는 사람: 이서연')).toBeOnTheScreen();
  expect(useHandoffDraftStore.getState().recipient).toBeNull();
  await fireEvent.press(screen.getByLabelText('다음'));
  expect(useHandoffDraftStore.getState().recipient?.member.userId).toBe('2');
  expect(onNext).toHaveBeenCalledTimes(1);
});
