import { Redirect, router } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useSignupStore } from '@/features/auth/store/signupStore';
import { ROUTES } from '@/shared/lib/routes';
import { goBackOr } from '@/shared/lib/navigation';
import { getLegalUrl } from '@/features/auth/lib/legalUrls';
import { reportError } from '@/shared/lib/reportError';
import { SignupTermsScreen } from '@/features/auth/screens/SignupTermsScreen';
export default function SignupTermsRoute() {
  const focused = useIsFocused();
  const pendingSession = useSignupStore((state) => state.pendingSession);
  const displayName = useSignupStore((state) => state.displayName);
  if (focused && pendingSession !== null) return <Redirect href={ROUTES.signup.complete} />;
  if (focused && !displayName) return <Redirect href={ROUTES.signup.name} />;
  const restart = () => {
    useSignupStore.getState().clear();
    router.dismissTo(ROUTES.auth.start);
  };
  return (
    <SignupTermsScreen
      onBack={() => goBackOr(ROUTES.signup.name)}
      onOpenTerm={(code) => {
        void openBrowserAsync(getLegalUrl(code), {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        }).catch(reportError);
      }}
      onComplete={() => router.replace(ROUTES.signup.complete)}
      onSocialSignupExpired={restart}
      onSignIn={restart}
    />
  );
}
