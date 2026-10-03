import { Redirect, router } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';
import { useSignupStore } from '@/features/auth/store/signupStore';

import { ROUTES } from '@/shared/lib/routes';
import { goBackOr } from '@/shared/lib/navigation';

import { SignupEmailScreen } from '@/features/auth/screens/SignupEmailScreen';

export default function SignupEmailRoute() {
  const focused = useIsFocused();
  const pendingSession = useSignupStore((state) => state.pendingSession);
  const displayName = useSignupStore((state) => state.displayName);

  if (focused && pendingSession !== null) return <Redirect href={ROUTES.signup.complete} />;
  if (focused && !displayName) return <Redirect href={ROUTES.signup.name} />;

  return (
    <SignupEmailScreen
      onBack={() => goBackOr(ROUTES.signup.name)}
      onNext={() => router.push(ROUTES.signup.code)}
    />
  );
}
