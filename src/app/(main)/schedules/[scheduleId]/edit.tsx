import { useLocalSearchParams } from 'expo-router';

import { ScheduleEditorScreen } from '@/features/schedules/screens/ScheduleEditorScreen';

export default function ScheduleEditRoute() {
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>();
  return <ScheduleEditorScreen scheduleId={scheduleId} />;
}
