import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';

import { SignupTermsScreen } from '@/features/auth/screens/SignupTermsScreen';

export default function SignupTermsRoute() {
  return (
    <SignupTermsScreen
      onBack={() => goBackOr('/signup/code')}
      // 계정이 이미 만들어졌으니 뒤로 가도 약관 화면이 다시 나오면 안 된다.
      onComplete={() => router.replace('/signup/complete')}
    />
  );
}
