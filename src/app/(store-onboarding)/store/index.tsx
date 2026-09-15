import { router } from 'expo-router';
import { Alert } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/lib/routes';

import { useSignOut } from '@/features/auth/api/account.mutations';
import { useEndInactiveMembership } from '@/features/stores/hooks/useEndInactiveMembership';
import { StoreEntryScreen } from '@/features/stores/screens/StoreEntryScreen';
import { useStoreCreateStore } from '@/features/stores/store/storeCreateStore';

export default function StoreEntryRoute() {
  const startCreate = useStoreCreateStore((state) => state.start);
  const signOut = useSignOut();
  useEndInactiveMembership();

  // 매장이 없는 사용자는 홈에서 다시 이 화면으로 돌아오므로, 뒤로가기는 로그아웃 후 시작 화면으로 보낸다.
  // 이 그룹 레이아웃에는 로그아웃 시 리다이렉트가 없어서 직접 이동한다.
  const handleBack = () => {
    if (signOut.isPending) return;
    signOut.mutate(undefined, {
      onSuccess: () => router.replace(ROUTES.auth.start),
      onError: (error) => Alert.alert('로그아웃하지 못했어요', normalizeError(error).message),
    });
  };

  return (
    <StoreEntryScreen
      onBack={handleBack}
      onJoin={() => router.push(ROUTES.storeJoin.index)}
      onCreate={() => {
        startCreate();
        router.push(ROUTES.storeCreate.index);
      }}
    />
  );
}
