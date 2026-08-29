import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * 로그인 전 영역. 이미 로그인된 사용자가 들어오면 앱 안쪽으로 돌려보낸다.
 * 가드를 화면마다 두지 않고 여기 한 곳에만 둔다.
 */
export default function AuthLayout() {
  const status = useAuthStore((state) => state.status);

  // 복원이 끝나기 전에 판단하면 로그인 화면이 한 번 깜빡인다. 스플래시가 덮고 있는 동안 기다린다.
  if (status === 'restoring') {
    return null;
  }

  if (status === 'signedIn') {
    return <Redirect href="/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
