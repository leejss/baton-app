import { Redirect, router } from 'expo-router';
import { ROUTES } from '@/shared/lib/routes';
import { StoreCreatedScreen } from '@/features/stores/screens/StoreCreatedScreen';
import { useStoreCreateStore } from '@/features/stores/store/storeCreateStore';
export default function CompleteStoreCreationRoute() {
  const created = useStoreCreateStore((state) => state.createdContext);
  const clear = useStoreCreateStore((state) => state.clear);
  if (!created) return <Redirect href={ROUTES.home} />;
  const finish = () => {
    clear();
    router.replace(ROUTES.home);
  };
  return <StoreCreatedScreen storeName={created.workspace.name} onBack={finish} onStart={finish} />;
}
