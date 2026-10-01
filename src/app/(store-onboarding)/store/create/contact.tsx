import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';
import { ROUTES } from '@/shared/lib/routes';

import { StoreCreateContactScreen } from '@/features/stores/screens/StoreCreateContactScreen';
import { useStoreCreateStore } from '@/features/stores/store/storeCreateStore';

export default function CreateStoreContactRoute() {
  const setCreatedContext = useStoreCreateStore((state) => state.setCreatedContext);

  return (
    <StoreCreateContactScreen
      onBack={() => goBackOr(ROUTES.storeCreate.location)}
      onCreated={(context) => {
        setCreatedContext(context);
        // 매장이 이미 만들어졌으니 뒤로 가도 입력 화면이 다시 나오면 안 된다.
        router.replace(ROUTES.storeCreate.complete);
      }}
      onAlreadyJoined={() => router.replace(ROUTES.home)}
    />
  );
}
