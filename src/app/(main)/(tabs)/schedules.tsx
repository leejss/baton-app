import { useLocalSearchParams } from 'expo-router';

import { SchedulesScreen } from '@/features/schedules/screens/SchedulesScreen';

export default function SchedulesRoute() {
  const { selectedDate } = useLocalSearchParams<{ selectedDate?: string }>();
  return <SchedulesScreen key={selectedDate} initialDate={selectedDate} />;
}
