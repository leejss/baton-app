import { router } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { goBackOr } from '@/shared/lib/navigation';

import { EmailLoginScreen } from '@/features/auth/screens/EmailLoginScreen';
import { useSignupStore } from '@/features/auth/store/signupStore';

export default function LoginRoute() {
  const startEmailSignup = useSignupStore((state) => state.startEmailSignup);

  return (
    <EmailLoginScreen
      onBack={() => goBackOr(ROUTES.auth.start)}
      onForgotPassword={() => router.push(ROUTES.resetPassword.index)}
      // 소셜 가입 정보는 이미 `signupStore`에 채워진 뒤라 이동만 하면 된다.
      onSocialSignupRequired={() => router.push(ROUTES.signup.name)}
      onSignUp={() => {
        startEmailSignup();
        router.push(ROUTES.signup.name);
      }}
    />
  );
}
