import { router } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { goBackOr } from '@/shared/lib/navigation';

import { SignupNameScreen } from '@/features/auth/screens/SignupNameScreen';

export default function SignupNameRoute() {
  return (
    <SignupNameScreen
      onBack={() => goBackOr(ROUTES.auth.start)}
      onNext={() => router.push(ROUTES.signup.email)}
    />
  );
}
