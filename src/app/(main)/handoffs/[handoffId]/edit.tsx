import { useLocalSearchParams, useRouter } from 'expo-router';

import { HandoffEditScreen } from '@/features/handoffs/screens/HandoffEditScreen';
import { QueryBoundary } from '@/shared/ui';

export default function HandoffEditRoute() {
  const router = useRouter();
  const { handoffId } = useLocalSearchParams<{ handoffId: string }>();

  return (
    <QueryBoundary resetKey={handoffId}>
      <HandoffEditScreen handoffId={handoffId} onBack={router.back} onSaved={router.back} />
    </QueryBoundary>
  );
}
