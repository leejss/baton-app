import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';
import { ROUTES } from '@/shared/lib/routes';

import { StoreJoinedScreen } from '@/features/stores/screens/StoreJoinedScreen';

export default function CompleteStoreJoinRoute() {
  return (
    <StoreJoinedScreen
      onBack={() => goBackOr(ROUTES.store)}
      onStart={() => router.replace(ROUTES.home)}
    />
  );
}
