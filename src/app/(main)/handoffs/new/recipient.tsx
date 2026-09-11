import { useRouter } from 'expo-router';

import { HandoffRecipientSelectScreen } from '@/features/handoffs/screens/HandoffRecipientSelectScreen';

export default function HandoffRecipientRoute() {
  const router = useRouter();

  return <HandoffRecipientSelectScreen onBack={router.back} onConfirm={router.back} />;
}
