import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';
import { ROUTES } from '@/shared/lib/routes';

import { StoreCreateNameScreen } from '@/features/stores/screens/StoreCreateNameScreen';

export default function CreateStoreRoute() {
  return (
    <StoreCreateNameScreen
      onBack={() => goBackOr(ROUTES.store)}
      onNext={() => router.push(ROUTES.storeCreate.complete)}
    />
  );
}
