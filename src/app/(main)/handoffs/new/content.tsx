import { useRouter } from 'expo-router';

import { HandoffContentScreen } from '@/features/handoffs/screens/HandoffContentScreen';

export default function HandoffContentRoute() {
  const router = useRouter();

  return (
    <HandoffContentScreen
      onBack={router.back}
      onRecipientPress={() => router.push('/(main)/handoffs/new/recipient')}
      onSent={() =>
        router.navigate({ pathname: '/(main)/(tabs)/handoffs', params: { scope: 'sent' } })
      }
    />
  );
}
