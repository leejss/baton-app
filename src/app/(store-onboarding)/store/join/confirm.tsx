import { Redirect, router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';
import { ROUTES } from '@/shared/lib/routes';

import { StoreJoinConfirmScreen } from '@/features/stores/screens/StoreJoinConfirmScreen';
import { useStoreJoinStore } from '@/features/stores/store/storeJoinStore';

export default function ConfirmStoreRoute() {
  const preview = useStoreJoinStore((state) => state.preview);
  const clear = useStoreJoinStore((state) => state.clear);

  // 앞 화면의 코드 검증 결과가 있어야 의미가 있는 화면이다.
  if (preview === null) {
    return <Redirect href={ROUTES.storeJoin.index} />;
  }

  return (
    <StoreJoinConfirmScreen
      storeName={`${preview.storeName} ${preview.branchName}`}
      address={
        preview.detailAddress == null
          ? preview.address
          : `${preview.address} ${preview.detailAddress}`
      }
      storeContact={preview.storeContact}
      invitationCode={preview.invitationCode}
      onBack={() => goBackOr(ROUTES.storeJoin.index)}
      onJoined={() => {
        clear();
        router.replace(ROUTES.storeJoin.complete);
      }}
      onInvitationExpired={() => {
        clear();
        router.replace(ROUTES.storeJoin.index);
      }}
      onAlreadyJoined={() => {
        clear();
        router.replace(ROUTES.home);
      }}
    />
  );
}
