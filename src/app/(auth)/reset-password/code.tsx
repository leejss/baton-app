import { Redirect, router } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';

import { ROUTES } from '@/shared/lib/routes';
import { goBackOr } from '@/shared/lib/navigation';

import { PasswordResetCodeScreen } from '@/features/auth/screens/PasswordResetCodeScreen';
import { usePasswordResetStore } from '@/features/auth/store/passwordResetStore';

export default function PasswordResetCodeRoute() {
  const focused = useIsFocused();
  const isComplete = usePasswordResetStore((state) => state.isComplete);
  const email = usePasswordResetStore((state) => state.email);

  // 딥링크로 중간 단계에 바로 들어온 경우. 보낼 코드가 없으니 처음부터 시작한다.
  if (focused && isComplete) return <Redirect href={ROUTES.resetPassword.done} />;
  if (focused && !email) {
    return <Redirect href={ROUTES.resetPassword.index} />;
  }

  return (
    <PasswordResetCodeScreen
      onBack={() => goBackOr(ROUTES.resetPassword.index)}
      onBackToSignIn={() => router.navigate(ROUTES.auth.login)}
      onChangeEmail={() => goBackOr(ROUTES.resetPassword.index)}
      onVerified={() => router.push(ROUTES.resetPassword.newPassword)}
    />
  );
}
