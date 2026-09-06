import { Redirect, router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';

import { PasswordResetCodeScreen } from '@/features/auth/screens/PasswordResetCodeScreen';
import { usePasswordResetStore } from '@/features/auth/store/passwordResetStore';

export default function PasswordResetCodeRoute() {
  const email = usePasswordResetStore((state) => state.email);

  // 딥링크로 중간 단계에 바로 들어온 경우. 보낼 코드가 없으니 처음부터 시작한다.
  if (email === null) {
    return <Redirect href="/reset-password" />;
  }

  return (
    <PasswordResetCodeScreen
      onBack={() => goBackOr('/reset-password')}
      onBackToSignIn={() => router.navigate('/login')}
      onChangeEmail={() => goBackOr('/reset-password')}
      onVerified={() => router.push('/reset-password/new-password')}
    />
  );
}
