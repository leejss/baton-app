import { router } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { goBackOr } from '@/shared/lib/navigation';

import { SignupEmailScreen } from '@/features/auth/screens/SignupEmailScreen';

export default function SignupEmailRoute() {
  return (
    <SignupEmailScreen
      onBack={() => goBackOr(ROUTES.signup.name)}
      onNext={() => router.push(ROUTES.signup.code)}
    />
  );
}
