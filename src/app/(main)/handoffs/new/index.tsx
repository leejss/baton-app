import { useLocalSearchParams, useRouter } from 'expo-router';

import { HandoffTypeSelectScreen } from '@/features/handoffs/screens/HandoffTypeSelectScreen';

export default function NewHandoffRoute() {
  const router = useRouter();
  const { recipientId } = useLocalSearchParams<{ recipientId?: string }>();

  return (
    <HandoffTypeSelectScreen
      initialRecipientId={recipientId}
      onExit={router.back}
      onNext={() => router.push('/(main)/handoffs/new/content')}
    />
  );
}
