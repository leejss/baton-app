import { Redirect, Stack } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';

import { ROUTES } from '@/shared/lib/routes';
import { SignupCompleteScreen } from '@/features/auth/screens/SignupCompleteScreen';
import { useSignupStore } from '@/features/auth/store/signupStore';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function SignupCompleteRoute() {
  const focused = useIsFocused();
  const pendingSession = useSignupStore((state) => state.pendingSession);
  const status = useAuthStore((state) => state.status);
  if (focused && pendingSession === null && status !== 'signedIn') {
    return <Redirect href={ROUTES.auth.login} />;
  }
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <SignupCompleteScreen />
    </>
  );
}
