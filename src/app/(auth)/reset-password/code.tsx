import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';

import { PasswordResetCodeScreen } from '@/features/auth/screens/PasswordResetCodeScreen';

export default function PasswordResetCodeRoute() {
  return (
    <PasswordResetCodeScreen
      onBack={() => goBackOr('/reset-password')}
      onBackToSignIn={() => router.navigate('/login')}
      onChangeEmail={() => goBackOr('/reset-password')}
      onSubmit={() => router.push('/reset-password/new-password')}
    />
  );
}
