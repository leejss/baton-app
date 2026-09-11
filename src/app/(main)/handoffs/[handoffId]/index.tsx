import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { HandoffDetailScreen } from '@/features/handoffs/screens/HandoffDetailScreen';

export default function HandoffDetailRoute() {
  const router = useRouter();
  const { handoffId } = useLocalSearchParams<{ handoffId: string }>();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.handoffs.list('all'));
  };

  return (
    <HandoffDetailScreen
      handoffId={handoffId}
      onBack={handleBack}
      onDeleted={() => router.replace(ROUTES.handoffs.list('sent'))}
      onEdit={() => router.push(ROUTES.handoffs.edit(handoffId))}
      onHome={() => router.navigate(ROUTES.home)}
    />
  );
}
