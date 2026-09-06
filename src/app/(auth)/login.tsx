import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';

import { EmailLoginScreen } from '@/features/auth/screens/EmailLoginScreen';
import { useSignupStore } from '@/features/auth/store/signupStore';

export default function LoginRoute() {
  const startEmailSignup = useSignupStore((state) => state.startEmailSignup);

  return (
    <EmailLoginScreen
      onBack={() => goBackOr('/start')}
      onForgotPassword={() => router.push('/reset-password')}
      onSignUp={() => {
        startEmailSignup();
        router.push('/signup/name');
      }}
    />
  );
}
