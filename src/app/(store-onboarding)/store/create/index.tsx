import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';
import { ROUTES } from '@/shared/lib/routes';

import { StoreCreateNameScreen } from '@/features/stores/screens/StoreCreateNameScreen';
import { StoreOnboardingEntryGate } from '@/features/stores/components/StoreOnboardingEntryGate';

export default function CreateStoreRoute() {
  return (
    <StoreOnboardingEntryGate onBack={() => goBackOr(ROUTES.store)}>
      <StoreCreateNameScreen
        onBack={() => goBackOr(ROUTES.store)}
        onNext={() => router.push(ROUTES.storeCreate.location)}
      />
    </StoreOnboardingEntryGate>
  );
}
