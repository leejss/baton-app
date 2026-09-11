import { useLocalSearchParams, useRouter } from 'expo-router';

import { HandoffDetailScreen } from '@/features/handoffs/screens/HandoffDetailScreen';
import { QueryBoundary } from '@/shared/ui';

export default function HandoffDetailRoute() {
  const router = useRouter();
  const { handoffId } = useLocalSearchParams<{ handoffId: string }>();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace({
      pathname: '/(main)/(tabs)/handoffs',
      params: { scope: 'all' },
    });
  };

  return (
    <QueryBoundary resetKey={handoffId} onBack={handleBack}>
      <HandoffDetailScreen
        handoffId={handoffId}
        onBack={handleBack}
        onDeleted={() =>
          router.replace({
            pathname: '/(main)/(tabs)/handoffs',
            params: { scope: 'sent' },
          })
        }
        onEdit={() =>
          router.push({
            pathname: '/(main)/handoffs/[handoffId]/edit',
            params: { handoffId },
          })
        }
        onHome={() => router.navigate('/(main)/(tabs)/home')}
      />
    </QueryBoundary>
  );
}
