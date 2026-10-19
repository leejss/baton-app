import { Redirect, router } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';
import { useSignupStore } from '@/features/auth/store/signupStore';
import { ROUTES } from '@/shared/lib/routes';
import { SignupNameScreen } from '@/features/auth/screens/SignupNameScreen';
export default function SignupNameRoute() {
  const focused = useIsFocused();
  const pendingSession = useSignupStore((state) => state.pendingSession);
  if (focused && pendingSession !== null) return <Redirect href={ROUTES.signup.complete} />;
  const restart = () => {
    useSignupStore.getState().clear();
    router.dismissTo(ROUTES.auth.start);
  };
  return (
    <SignupNameScreen
      onBack={restart}
      onSocialSignupExpired={restart}
      onNext={() => router.push(ROUTES.signup.terms)}
    />
  );
}
