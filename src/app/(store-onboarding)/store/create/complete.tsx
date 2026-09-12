import { Redirect, router } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';

import { useAuthStore } from '@/features/auth/store/authStore';
import { StoreCreatedScreen } from '@/features/stores/screens/StoreCreatedScreen';
import { useStoreCreateStore } from '@/features/stores/store/storeCreateStore';

export default function CompleteStoreCreationRoute() {
  const created = useStoreCreateStore((state) => state.createdContext);
  // 매장을 만든 사람이 곧 관리자다(STORE-07). 계약 응답에 이름이 없어 세션에서 읽는다.
  const managerName = useAuthStore((state) => state.session?.user.displayName);
  const clear = useStoreCreateStore((state) => state.clear);

  // 생성 직후에만 의미가 있는 화면이다. 값 없이 들어오면(딥링크·새로고침) 홈으로 보낸다.
  if (created === null) {
    return <Redirect href={ROUTES.home} />;
  }

  const { store, initialInvitationCode } = created;

  return (
    <StoreCreatedScreen
      storeName={`${store.storeName} ${store.branchName}`}
      address={
        store.detailAddress == null ? store.address : `${store.address} ${store.detailAddress}`
      }
      managerName={managerName}
      storeContact={store.storeContact}
      invitationCode={initialInvitationCode?.code ?? null}
      onBack={() => router.replace(ROUTES.home)}
      onStart={() => {
        clear();
        router.replace(ROUTES.home);
      }}
    />
  );
}
