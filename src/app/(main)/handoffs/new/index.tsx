import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { isCalendarDate } from '@/shared/lib/date';
import { HandoffTypeSelectScreen } from '@/features/handoffs/screens/HandoffTypeSelectScreen';

export default function NewHandoffRoute() {
  const router = useRouter();
  const { recipientId, workDate: dateParam } = useLocalSearchParams<{
    recipientId?: string;
    workDate?: string;
  }>();
  const workDate = dateParam && isCalendarDate(dateParam) ? dateParam : undefined;

  return (
    <HandoffTypeSelectScreen
      initialRecipientId={recipientId}
      workDate={workDate}
      onExit={router.back}
      onNext={() => router.push(ROUTES.handoffs.new.content(workDate))}
    />
  );
}
