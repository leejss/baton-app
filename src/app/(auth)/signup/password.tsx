import { router } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { goBackOr } from '@/shared/lib/navigation';

import { SignupPasswordScreen } from '@/features/auth/screens/SignupPasswordScreen';

export default function SignupPasswordRoute() {
  return (
    <SignupPasswordScreen
      onBack={() => goBackOr(ROUTES.signup.code)}
      onNext={() => router.push(ROUTES.signup.terms)}
    />
  );
}
