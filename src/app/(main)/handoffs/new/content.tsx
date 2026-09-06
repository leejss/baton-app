import { useLocalSearchParams } from 'expo-router';

import { RoutePlaceholderScreen } from '@/features/routes/screens/RoutePlaceholderScreen';

export default function HandoffContentRoute() {
  const { type } = useLocalSearchParams<{ type?: string }>();

  return (
    <RoutePlaceholderScreen
      title="인수인계 내용 작성"
      description={`인수인계 유형: ${type ?? '미선택'}`}
      featureIds="HAND-02~06"
    />
  );
}
