import { useLocalSearchParams } from 'expo-router';

import { RoutePlaceholderScreen } from '@/features/routes/screens/RoutePlaceholderScreen';

export default function HandoffEditRoute() {
  const { handoffId } = useLocalSearchParams<{ handoffId: string }>();
  return (
    <RoutePlaceholderScreen
      title="인수인계 수정"
      description={`인수인계 ID: ${handoffId}`}
      featureIds="HAND-11"
    />
  );
}
