import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';

import { PasswordResetEmailScreen } from '@/features/auth/screens/PasswordResetEmailScreen';

export default function PasswordResetEmailRoute() {
  return (
    <PasswordResetEmailScreen
      onBack={() => goBackOr('/login')}
      // 스택에 로그인 화면이 있으면 그 화면으로 돌아가고, 없으면 새로 연다.
      onBackToSignIn={() => router.navigate('/login')}
      onRequestCode={() => router.push('/reset-password/code')}
    />
  );
}
