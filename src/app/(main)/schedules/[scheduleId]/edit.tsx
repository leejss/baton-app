import { useLocalSearchParams } from 'expo-router';

import { RoutePlaceholderScreen } from '@/features/routes/screens/RoutePlaceholderScreen';

export default function ScheduleEditRoute() {
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>();
  return (
    <RoutePlaceholderScreen
      title="근무표 수정"
      description={`근무 일정 ID: ${scheduleId}`}
      featureIds="SCH-05~06"
    />
  );
}
