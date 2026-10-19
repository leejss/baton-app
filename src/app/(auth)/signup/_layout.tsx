import { Redirect, Stack } from 'expo-router';
import { useSignupStore } from '@/features/auth/store/signupStore';
import { ROUTES } from '@/shared/lib/routes';
export default function SignupLayout() {
  const canContinue = useSignupStore(
    (state) =>
      state.pendingSession !== null ||
      (state.provider !== null && state.socialSignupToken !== null),
  );
  if (!canContinue) return <Redirect href={ROUTES.auth.start} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
