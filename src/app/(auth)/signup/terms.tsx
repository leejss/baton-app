import { router } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

import { ROUTES } from '@/shared/lib/routes';
import { goBackOr } from '@/shared/lib/navigation';
import { getLegalUrl } from '@/features/auth/lib/legalUrls';

import { SignupTermsScreen } from '@/features/auth/screens/SignupTermsScreen';

export default function SignupTermsRoute() {
  return (
    <SignupTermsScreen
      onBack={() => goBackOr(ROUTES.signup.code)}
      onOpenTerm={(code) => {
        void openBrowserAsync(getLegalUrl(code), {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        });
      }}
      // 계정이 이미 만들어졌으니 뒤로 가도 약관 화면이 다시 나오면 안 된다.
      onComplete={() => router.replace(ROUTES.signup.complete)}
      // 가입 상태는 화면이 이미 비웠다. 소셜 로그인 버튼이 있는 시작 화면으로 되돌린다.
      onSocialSignupExpired={() => router.navigate(ROUTES.auth.start)}
    />
  );
}
