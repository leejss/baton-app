import { useRouter } from 'expo-router';

import { HandoffRecipientSelectScreen } from '@/features/handoffs/screens/HandoffRecipientSelectScreen';
import { QueryBoundary } from '@/shared/ui';

export default function HandoffRecipientRoute() {
  const router = useRouter();

  return (
    <QueryBoundary>
      <HandoffRecipientSelectScreen onBack={router.back} onConfirm={router.back} />
    </QueryBoundary>
  );
}
