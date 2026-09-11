import { router } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { goBackOr } from '@/shared/lib/navigation';

import { SignupCodeScreen } from '@/features/auth/screens/SignupCodeScreen';

export default function SignupCodeRoute() {
  return (
    <SignupCodeScreen
      onBack={() => goBackOr(ROUTES.signup.email)}
      // 소셜 가입은 비밀번호 단계가 없어 약관으로 바로 간다. 판단은 화면이 한다.
      onNext={(step) =>
        router.push(step === 'password' ? ROUTES.signup.password : ROUTES.signup.terms)
      }
    />
  );
}
