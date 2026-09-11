import { useLocalSearchParams, useRouter } from 'expo-router';

import { HandoffEditScreen } from '@/features/handoffs/screens/HandoffEditScreen';

export default function HandoffEditRoute() {
  const router = useRouter();
  const { handoffId } = useLocalSearchParams<{ handoffId: string }>();

  return <HandoffEditScreen handoffId={handoffId} onBack={router.back} onSaved={router.back} />;
}
