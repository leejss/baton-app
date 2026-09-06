import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * 로그인이 필요한 영역. 세션이 없으면 시작 화면으로 돌려보낸다.
 *
 * TODO(STORE-01): 여기는 **매장 소속까지 끝난** 사용자만 들어와야 한다. 지금은 세션만
 * 확인해서 미소속 사용자도 홈에 진입할 수 있다. 게이트를 넣을 때 이 가드도 함께 좁힌다.
 */
export default function AppLayout() {
  const status = useAuthStore((state) => state.status);

  if (status === 'restoring') {
    return null;
  }

  if (status === 'signedOut') {
    return <Redirect href="/start" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
