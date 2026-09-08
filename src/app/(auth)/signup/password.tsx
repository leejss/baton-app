import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';

import { SignupPasswordScreen } from '@/features/auth/screens/SignupPasswordScreen';

export default function SignupPasswordRoute() {
  return (
    <SignupPasswordScreen
      onBack={() => goBackOr('/signup/code')}
      onNext={() => router.push('/signup/terms')}
    />
  );
}
