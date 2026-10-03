import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { reportError } from '@/shared/lib/reportError';
import { useAppleSignIn, useKakaoSignIn } from '@/features/auth/api/auth.mutations';
import type { SocialProvider } from '@/features/auth/api/signup.schema';
import { useAuthOperation } from '@/features/auth/hooks/useAuthOperation';
import { isAppleSignInAvailable } from '@/features/auth/lib/appleAuth';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSignupStore } from '@/features/auth/store/signupStore';

export type UseSocialSignInParams = { onSignupRequired: () => void };

export function useSocialSignIn({ onSignupRequired }: UseSocialSignInParams) {
  const kakao = useKakaoSignIn();
  const apple = useAppleSignIn();
  const operation = useAuthOperation('login');
  const [canUseApple, setCanUseApple] = useState(false);

  useEffect(() => {
    let mounted = true;
    void isAppleSignInAvailable()
      .then((available) => {
        if (mounted) setCanUseApple(available);
      })
      .catch(reportError);
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = (provider: SocialProvider) =>
    operation.run(
      provider,
      async ({ signal, isCurrent, complete }) => {
        const outcome = await (provider === 'kakao' ? kakao : apple).mutateAsync({ signal });
        if (!isCurrent()) return;
        if (outcome.status === 'signedIn') {
          await useAuthStore.getState().signIn(outcome.session, signal);
          return;
        }
        useSignupStore.getState().startSocialSignup({
          provider,
          socialSignupToken: outcome.socialSignupToken,
          expiresAt: outcome.expiresAt,
        });
        complete(onSignupRequired);
      },
      (error) => Alert.alert('로그인하지 못했어요', normalizeError(error).message),
    );

  return {
    canUseApple,
    isPending: operation.isPending,
    isKakaoPending: operation.kind === 'kakao',
    isApplePending: operation.kind === 'apple',
    signInWithKakao: () => signIn('kakao'),
    signInWithApple: () => signIn('apple'),
  };
}
