import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';

/** 로그인이 필요한 영역. 세션이 없으면 시작 화면으로 돌려보낸다. */
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
