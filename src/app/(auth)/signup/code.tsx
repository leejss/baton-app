import { Redirect, router } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';
import { useSignupStore } from '@/features/auth/store/signupStore';

import { ROUTES } from '@/shared/lib/routes';
import { goBackOr } from '@/shared/lib/navigation';

import { SignupCodeScreen } from '@/features/auth/screens/SignupCodeScreen';

export default function SignupCodeRoute() {
  const focused = useIsFocused();
  const pendingSession = useSignupStore((state) => state.pendingSession);
  const displayName = useSignupStore((state) => state.displayName);
  const email = useSignupStore((state) => state.email);

  if (focused && pendingSession !== null) return <Redirect href={ROUTES.signup.complete} />;
  if (focused && !displayName) return <Redirect href={ROUTES.signup.name} />;
  if (focused && !email) return <Redirect href={ROUTES.signup.email} />;

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
