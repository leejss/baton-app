import { useLocalSearchParams, useRouter } from 'expo-router';
import { isCalendarDate } from '@/shared/lib/date';

import { HandoffRecipientSelectScreen } from '@/features/handoffs/screens/HandoffRecipientSelectScreen';

export default function HandoffRecipientRoute() {
  const router = useRouter();
  const { workDate: dateParam } = useLocalSearchParams<{ workDate?: string }>();
  const workDate = dateParam && isCalendarDate(dateParam) ? dateParam : undefined;

  return (
    <HandoffRecipientSelectScreen
      workDate={workDate}
      onBack={router.back}
      onConfirm={router.back}
    />
  );
}
