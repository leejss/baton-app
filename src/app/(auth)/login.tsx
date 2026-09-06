import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';

import { EmailLoginScreen } from '@/features/auth/screens/EmailLoginScreen';

export default function LoginRoute() {
  return (
    <EmailLoginScreen
      onBack={() => goBackOr('/start')}
      onForgotPassword={() => router.push('/reset-password')}
    />
  );
}
