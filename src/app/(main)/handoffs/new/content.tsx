import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { isCalendarDate } from '@/shared/lib/date';
import { HandoffContentScreen } from '@/features/handoffs/screens/HandoffContentScreen';

export default function HandoffContentRoute() {
  const router = useRouter();
  const { workDate: dateParam } = useLocalSearchParams<{ workDate?: string }>();
  const workDate = dateParam && isCalendarDate(dateParam) ? dateParam : undefined;

  return (
    <HandoffContentScreen
      workDate={workDate}
      onBack={router.back}
      onRecipientPress={() => router.push(ROUTES.handoffs.new.recipient(workDate))}
      onSent={(handoffId) => router.replace(ROUTES.handoffs.detail(handoffId))}
    />
  );
}
