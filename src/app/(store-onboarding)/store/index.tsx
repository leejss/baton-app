import { router } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';

import { StoreEntryScreen } from '@/features/stores/screens/StoreEntryScreen';
import { useStoreCreateStore } from '@/features/stores/store/storeCreateStore';

export default function StoreEntryRoute() {
  const startCreate = useStoreCreateStore((state) => state.start);

  return (
    <StoreEntryScreen
      onBack={() => router.replace(ROUTES.home)}
      onJoin={() => router.push(ROUTES.storeJoin.index)}
      onCreate={() => {
        startCreate();
        router.push(ROUTES.storeCreate.index);
      }}
    />
  );
}
