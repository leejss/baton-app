import { Redirect, router } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';
import { useSignupStore } from '@/features/auth/store/signupStore';

import { ROUTES } from '@/shared/lib/routes';
import { goBackOr } from '@/shared/lib/navigation';

import { SignupPasswordScreen } from '@/features/auth/screens/SignupPasswordScreen';

export default function SignupPasswordRoute() {
  const focused = useIsFocused();
  const mode = useSignupStore((state) => state.mode);
  const pendingSession = useSignupStore((state) => state.pendingSession);
  const displayName = useSignupStore((state) => state.displayName);
  const email = useSignupStore((state) => state.email);
  const token = useSignupStore((state) => state.verificationToken);

  if (focused && pendingSession !== null) return <Redirect href={ROUTES.signup.complete} />;
  if (focused && !displayName) return <Redirect href={ROUTES.signup.name} />;
  if (focused && !email) return <Redirect href={ROUTES.signup.email} />;
  if (focused && token === null) return <Redirect href={ROUTES.signup.code} />;
  if (focused && mode === 'social') return <Redirect href={ROUTES.signup.terms} />;

  return (
    <SignupPasswordScreen
      onVerificationExpired={() => {
        useSignupStore.getState().invalidateChallenge();
        router.dismissTo(ROUTES.signup.code);
      }}
      onBack={() => goBackOr(ROUTES.signup.code)}
      onNext={() => router.push(ROUTES.signup.terms)}
    />
  );
}
