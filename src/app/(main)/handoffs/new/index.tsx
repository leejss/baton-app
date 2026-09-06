import { useRouter } from 'expo-router';

import { HandoffTypeSelectScreen } from '@/features/handoffs/screens/HandoffTypeSelectScreen';

export default function NewHandoffRoute() {
  const router = useRouter();

  return (
    <HandoffTypeSelectScreen
      onExit={router.back}
      onNext={() => router.push('/(main)/handoffs/new/content')}
    />
  );
}
