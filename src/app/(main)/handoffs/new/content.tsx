import { useRouter } from 'expo-router';
import { ROUTES } from '@/shared/lib/routes';
import { HandoffContentScreen } from '@/features/handoffs/screens/HandoffContentScreen';
export default function HandoffContentRoute() {
  const router = useRouter();
  return (
    <HandoffContentScreen
      onBack={router.back}
      onRecipientPress={() => router.push(ROUTES.handoffs.new.recipient())}
      onSent={(id) => router.replace(ROUTES.handoffs.detail(id))}
    />
  );
}
