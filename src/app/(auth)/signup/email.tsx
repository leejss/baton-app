import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';

import { SignupEmailScreen } from '@/features/auth/screens/SignupEmailScreen';

export default function SignupEmailRoute() {
  return (
    <SignupEmailScreen
      onBack={() => goBackOr('/signup/name')}
      onNext={() => router.push('/signup/code')}
    />
  );
}
