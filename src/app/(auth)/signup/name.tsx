import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';

import { SignupNameScreen } from '@/features/auth/screens/SignupNameScreen';

export default function SignupNameRoute() {
  return (
    <SignupNameScreen
      onBack={() => goBackOr('/start')}
      onNext={() => router.push('/signup/email')}
    />
  );
}
