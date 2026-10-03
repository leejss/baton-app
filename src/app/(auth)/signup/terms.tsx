import { Redirect, router } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';
import { useSignupStore } from '@/features/auth/store/signupStore';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

import { ROUTES } from '@/shared/lib/routes';
import { goBackOr } from '@/shared/lib/navigation';
import { getLegalUrl } from '@/features/auth/lib/legalUrls';

import { SignupTermsScreen } from '@/features/auth/screens/SignupTermsScreen';

export default function SignupTermsRoute() {
  const focused = useIsFocused();
  const pendingSession = useSignupStore((state) => state.pendingSession);
  const displayName = useSignupStore((state) => state.displayName);
  const email = useSignupStore((state) => state.email);
  const token = useSignupStore((state) => state.verificationToken);
  const mode = useSignupStore((state) => state.mode);
  const password = useSignupStore((state) => state.password);

  if (focused && pendingSession !== null) return <Redirect href={ROUTES.signup.complete} />;
  if (focused && !displayName) return <Redirect href={ROUTES.signup.name} />;
  if (focused && !email) return <Redirect href={ROUTES.signup.email} />;
  if (focused && token === null) return <Redirect href={ROUTES.signup.code} />;
  if (focused && mode === 'email' && !password) return <Redirect href={ROUTES.signup.password} />;

  return (
    <SignupTermsScreen
      onVerificationExpired={() => {
        useSignupStore.getState().invalidateChallenge();
        router.dismissTo(ROUTES.signup.code);
      }}
      onBack={() => goBackOr(ROUTES.signup.code)}
      onOpenTerm={(code) => {
        void openBrowserAsync(getLegalUrl(code), {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        });
      }}
      // 계정이 이미 만들어졌으니 뒤로 가도 약관 화면이 다시 나오면 안 된다.
      onComplete={() => router.replace(ROUTES.signup.complete)}
      // 가입 상태는 화면이 이미 비웠다. 소셜 로그인 버튼이 있는 시작 화면으로 되돌린다.
      onSignIn={() => router.navigate(ROUTES.auth.start)}
      onSocialSignupExpired={() => router.navigate(ROUTES.auth.start)}
    />
  );
}
