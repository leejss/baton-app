import { Redirect, router } from 'expo-router';
import { ROUTES } from '@/shared/lib/routes';
import { StoreJoinConfirmScreen } from '@/features/stores/screens/StoreJoinConfirmScreen';
import { useStoreJoinStore } from '@/features/stores/store/storeJoinStore';
import { reportError } from '@/shared/lib/reportError';
export default function ConfirmStoreRoute() {
  const { token, preview, clear } = useStoreJoinStore();
  if (!preview || !token) return <Redirect href={ROUTES.storeJoin.index} />;
  return (
    <StoreJoinConfirmScreen
      preview={preview}
      token={token}
      onBack={() => router.replace(ROUTES.storeJoin.index)}
      onJoined={() => {
        void clear().catch(reportError);
        router.replace(ROUTES.storeJoin.complete);
      }}
      onInvitationExpired={() => {
        void clear().catch(reportError);
        router.replace(ROUTES.storeJoin.index);
      }}
    />
  );
}
