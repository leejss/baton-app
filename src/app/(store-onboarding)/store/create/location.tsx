import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';
import { ROUTES } from '@/shared/lib/routes';

import { StoreCreateBranchScreen } from '@/features/stores/screens/StoreCreateBranchScreen';

export default function CreateStoreLocationRoute() {
  return (
    <StoreCreateBranchScreen
      onBack={() => goBackOr(ROUTES.storeCreate.index)}
      onNext={() => router.push(ROUTES.storeCreate.contact)}
    />
  );
}
