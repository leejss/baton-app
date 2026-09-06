import { useRouter } from 'expo-router';

import { HandoffContentScreen } from '@/features/handoffs/screens/HandoffContentScreen';

export default function HandoffContentRoute() {
  const router = useRouter();

  return (
    <HandoffContentScreen
      onBack={router.back}
      onRecipientPress={() => router.push('/(main)/handoffs/new/recipient')}
      onSent={(handoffId) =>
        router.replace({
          pathname: '/(main)/handoffs/[handoffId]',
          params: { handoffId },
        })
      }
    />
  );
}
