import { useLocalSearchParams } from 'expo-router';

import { SchedulesScreen } from '@/features/schedules/screens/SchedulesScreen';

export default function ManageSchedulesRoute() {
  const { selectedDate } = useLocalSearchParams<{ selectedDate?: string }>();
  return <SchedulesScreen initialDate={selectedDate} isManaging />;
}
