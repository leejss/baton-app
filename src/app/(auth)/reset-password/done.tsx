import { Redirect, Stack, router } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';

import { ROUTES } from '@/shared/lib/routes';
import { PasswordResetDoneScreen } from '@/features/auth/screens/PasswordResetDoneScreen';
import { usePasswordResetStore } from '@/features/auth/store/passwordResetStore';

export default function PasswordResetDoneRoute() {
  const focused = useIsFocused();
  const isComplete = usePasswordResetStore((state) => state.isComplete);
  const clear = usePasswordResetStore((state) => state.clear);

  if (focused && !isComplete) return <Redirect href={ROUTES.resetPassword.index} />;

  // 재설정이 끝난 뒤라 뒤로 가기도 로그인 화면으로 보낸다. 인증 토큰은 여기서 버린다.
  const goToSignIn = () => {
    clear();
    router.navigate(ROUTES.auth.login);
  };

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <PasswordResetDoneScreen onBack={goToSignIn} onGoToSignIn={goToSignIn} />
    </>
  );
}
