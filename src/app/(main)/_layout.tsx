import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * 로그인한 사용자가 사용하는 메인 영역. 세션이 없으면 시작 화면으로 돌려보낸다.
 *
 * TODO(STORE-01): 매장 소속 게이트가 구현되면 활성 소속이 있는 사용자만 허용한다.
 */

export default function MainLayout() {
  const status = useAuthStore((state) => state.status);

  if (status === 'restoring') {
    return null;
  }

  if (status === 'signedOut') {
    return <Redirect href="/start" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: '알림' }} />
    </Stack>
  );
}
