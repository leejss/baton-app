import { Redirect, Stack } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { ActiveStoreGate } from '@/features/stores/components/ActiveStoreGate';
import { QueryBoundary } from '@/shared/ui/QueryBoundary';

import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * 로그인한 사용자가 사용하는 메인 영역. 세션이 없으면 시작 화면으로 돌려보낸다.
 *
 * 활성 매장 소속이 없는 사용자는 매장 시작 화면으로 이동한다.
 */

export default function MainLayout() {
  const status = useAuthStore((state) => state.status);

  if (status === 'restoring') {
    return null;
  }

  if (status === 'signedOut') {
    return <Redirect href={ROUTES.auth.start} />;
  }

  return (
    <QueryBoundary>
      <ActiveStoreGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="notifications" />
        </Stack>
      </ActiveStoreGate>
    </QueryBoundary>
  );
}
