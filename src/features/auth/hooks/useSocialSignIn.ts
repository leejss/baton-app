import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { normalizeError } from '@/shared/api/errors';

import { isCanceled, useAppleSignIn, useKakaoSignIn } from '@/features/auth/api/auth.mutations';
import type { SocialProvider } from '@/features/auth/api/signup.schema';
import { isAppleSignInAvailable } from '@/features/auth/lib/appleAuth';
import { useSignupStore } from '@/features/auth/store/signupStore';

/**
 * 카카오·Apple 로그인 처리. 시작 화면과 이메일 로그인 화면이 같은 버튼을 갖고 있어
 * 로직을 한 곳에 둔다 — 한쪽만 고쳐서 다른 쪽이 조용히 안 되는 일을 막는다.
 *
 * 두 제공자의 결과 처리는 완전히 같다(계약 §12-1). 연결된 계정이면 세션이 생기고
 * `(auth)/_layout`의 가드가 앱 안쪽으로 보내며, 신규 소셜 식별자면 가입 플로우로 잇는다.
 */
export type UseSocialSignInParams = {
  /** 신규 소셜 식별자라 가입이 필요할 때. 라우트가 가입 첫 화면으로 보낸다. */
  onSignupRequired: () => void;
};

export function useSocialSignIn({ onSignupRequired }: UseSocialSignInParams) {
  const kakao = useKakaoSignIn();
  const apple = useAppleSignIn();
  const startSocialSignup = useSignupStore((state) => state.startSocialSignup);

  /**
   * Apple 로그인은 iOS 13 이상에서만 쓸 수 있다. 안드로이드에서는 버튼 자체를 숨긴다 —
   * 눌러도 안 되는 버튼을 보여주는 것보다 없는 게 낫다.
   */
  const [canUseApple, setCanUseApple] = useState(false);
  useEffect(() => {
    void isAppleSignInAvailable().then(setCanUseApple);
  }, []);

  type Outcome =
    | { status: 'signedIn' }
    | {
        status: 'signupRequired';
        socialSignupToken: string;
        suggestedEmail?: string;
        suggestedDisplayName?: string;
      };

  const handleOutcome = (provider: SocialProvider, outcome: Outcome) => {
    if (outcome.status === 'signedIn') {
      return;
    }

    startSocialSignup({
      provider,
      socialSignupToken: outcome.socialSignupToken,
      suggestedDisplayName: outcome.suggestedDisplayName,
      suggestedEmail: outcome.suggestedEmail,
    });
    onSignupRequired();
  };

  const handleError = (error: unknown) => {
    // 사용자가 직접 닫은 경우엔 아무것도 띄우지 않는다.
    if (isCanceled(error)) {
      return;
    }
    Alert.alert('로그인하지 못했어요', normalizeError(error).message);
  };

  return {
    canUseApple,
    isPending: kakao.isPending || apple.isPending,
    isKakaoPending: kakao.isPending,
    isApplePending: apple.isPending,

    signInWithKakao: () =>
      kakao.mutate(undefined, {
        onSuccess: (outcome) => handleOutcome('kakao', outcome),
        onError: handleError,
      }),

    signInWithApple: () =>
      apple.mutate(undefined, {
        onSuccess: (outcome) => handleOutcome('apple', outcome),
        onError: handleError,
      }),
  };
}
