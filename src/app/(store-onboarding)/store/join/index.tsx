import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';
import { ROUTES } from '@/shared/lib/routes';

import { StoreJoinCodeScreen } from '@/features/stores/screens/StoreJoinCodeScreen';
import { useStoreJoinStore } from '@/features/stores/store/storeJoinStore';

export default function JoinStoreRoute() {
  const setPreview = useStoreJoinStore((state) => state.setPreview);

  return (
    <StoreJoinCodeScreen
      onBack={() => goBackOr(ROUTES.store)}
      onPreviewed={(preview) => {
        setPreview(preview);
        router.push(ROUTES.storeJoin.confirm);
      }}
      onAlreadyJoined={() => router.replace(ROUTES.home)}
    />
  );
}
