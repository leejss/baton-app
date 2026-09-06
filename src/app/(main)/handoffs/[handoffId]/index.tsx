import { useLocalSearchParams } from 'expo-router';

import { RoutePlaceholderScreen } from '@/features/routes/screens/RoutePlaceholderScreen';

export default function HandoffDetailRoute() {
  const { handoffId } = useLocalSearchParams<{ handoffId: string }>();
  return (
    <RoutePlaceholderScreen
      title="인수인계 상세"
      description={`인수인계 ID: ${handoffId}`}
      featureIds="HAND-09~13"
    />
  );
}
