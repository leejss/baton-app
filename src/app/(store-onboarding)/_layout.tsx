import { Redirect, Stack } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';

import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * 매장 참여·생성 영역. 로그인한 사용자만 쓴다.
 * 세션이 어떤 경로로 끊기든(로그아웃, 세션 만료) 이 화면에 갇히지 않도록 시작 화면으로 돌려보낸다.
 */
export default function StoreOnboardingLayout() {
  const status = useAuthStore((state) => state.status);

  if (status === 'restoring') {
    return null;
  }

  if (status === 'signedOut') {
    return <Redirect href={ROUTES.auth.start} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
