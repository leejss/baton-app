import { router } from 'expo-router';
import { Alert } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/lib/routes';

import { useSignOut } from '@/features/auth/api/account.mutations';
import { StoreOnboardingEntryGate } from '@/features/stores/components/StoreOnboardingEntryGate';
import { StoreEntryScreen } from '@/features/stores/screens/StoreEntryScreen';
import { useStoreCreateStore } from '@/features/stores/store/storeCreateStore';

export default function StoreEntryRoute() {
  const startCreate = useStoreCreateStore((state) => state.start);
  const signOut = useSignOut();

  // 매장이 없는 사용자는 홈에서 다시 이 화면으로 돌아오므로, 뒤로가기는 로그아웃으로 처리한다.
  // 시작 화면 이동은 그룹 레이아웃이 로그아웃 상태를 보고 한다.
  const handleBack = () => {
    if (signOut.isPending) return;
    signOut.mutate(undefined, {
      onError: (error) => Alert.alert('로그아웃하지 못했어요', normalizeError(error).message),
    });
  };

  return (
    <StoreOnboardingEntryGate onBack={handleBack}>
      <StoreEntryScreen
        onBack={handleBack}
        onJoin={() => router.push(ROUTES.storeJoin.index)}
        onCreate={() => {
          startCreate();
          router.push(ROUTES.storeCreate.index);
        }}
      />
    </StoreOnboardingEntryGate>
  );
}
