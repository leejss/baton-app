import { useLocalSearchParams } from 'expo-router';

import { ScheduleEditorScreen } from '@/features/schedules/screens/ScheduleEditorScreen';

export default function NewScheduleRoute() {
  const { selectedDate } = useLocalSearchParams<{ selectedDate?: string }>();
  return <ScheduleEditorScreen initialDate={selectedDate} />;
}
