import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';
import { Box, Text, textStyles } from '@/shared/ui';
import { SCREEN_PADDING_X } from '@/theme';

import { isCanceled, useAppleSignIn, useKakaoSignIn } from '@/features/auth/api/auth.mutations';
import { isAppleSignInAvailable } from '@/features/auth/lib/appleAuth';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { OrDivider } from '@/features/auth/components/OrDivider';
import { StartButton } from '@/features/auth/components/StartButton';
import { useSignupStore } from '@/features/auth/store/signupStore';

/**
 * 세로 리듬은 Figma "02 시작(로그인 선택) 화면"(`943:111106`, 393×852) 실측값이다.
 *
 * 시안이 2px 그리드를 쓰는데 `spacing` 스케일은 4px 배수라 그대로 매핑되지 않는다.
 * 전역 스케일을 이 화면 하나 때문에 늘리는 대신, 시안에서 온 값임을 밝히고 여기 모아둔다.
 * 디자인의 간격 스케일이 확정되면 `spacing`으로 흡수한다.
 */
const SPEC = {
  /** 헤더 하단(106) → 워드마크 상단(124). */
  wordmarkTop: 18,
  wordmarkWidth: 153,
  wordmarkAspectRatio: 153 / 42,
  /** 워드마크 하단(166) → 태그라인 상단(178). */
  taglineTop: 12,
  /** 태그라인 하단(206) → 일러스트 상단(254). */
  illustrationTop: 48,
  illustrationWidth: 302,
  illustrationHeight: 254,
  /** 카카오·Apple 버튼 사이. */
  socialGap: 10,
  /** 소셜 묶음 ↔ 구분선 ↔ 이메일 버튼 사이. */
  actionGap: 18,
  /**
   * 이메일 버튼 하단(763) → 화면 하단(852)이 89인데, 그중 34는 홈 인디케이터 몫이다.
   * 나머지 55만 우리가 그리고 인디케이터 영역은 safe-area inset에 맡긴다.
   */
  bottomInset: 55,
} as const;

export type StartScreenProps = {
  /** 테스트에서 카카오 SDK를 타지 않고 눌림만 확인할 때 주입한다. */
  onStartWithKakao?: () => void;
  onStartWithApple?: () => void;
  onStartWithEmail?: () => void;
  /**
   * 소셜 인증은 됐지만 연결된 Baton 계정이 없을 때(계약 §12-1 `SIGNUP_REQUIRED`).
   * 가입 정보는 이미 `signupStore`에 채워진 뒤이므로 라우트는 가입 첫 화면으로만 보내면 된다.
   */
  onSocialSignupRequired?: () => void;
};

/** 아직 연결할 화면·API가 없는 동작. 조용히 삼키지 않고 로그로 남긴다. */
function notWired(action: string) {
  return () => logger.warn('시작 화면 동작이 아직 연결되지 않았습니다', { action });
}

export function StartScreen({
  onStartWithKakao,
  onStartWithApple,
  onStartWithEmail = notWired('email'),
  onSocialSignupRequired = notWired('socialSignup'),
}: StartScreenProps) {
  const insets = useSafeAreaInsets();
  const kakaoSignIn = useKakaoSignIn();
  const appleSignIn = useAppleSignIn();
  const startSocialSignup = useSignupStore((state) => state.startSocialSignup);

  /**
   * Apple 로그인은 iOS 13 이상에서만 쓸 수 있다. 안드로이드에서는 버튼 자체를 숨긴다 —
   * 눌러도 안 되는 버튼을 보여주는 것보다 없는 게 낫다.
   */
  const [canUseApple, setCanUseApple] = useState(false);
  useEffect(() => {
    void isAppleSignInAvailable().then(setCanUseApple);
  }, []);

  const isBusy = kakaoSignIn.isPending || appleSignIn.isPending;

  /** 소셜 인증 결과 처리는 카카오·애플이 동일하다. 갈래만 보고 다음 화면을 정한다. */
  const handleSocialOutcome = (
    provider: 'kakao' | 'apple',
    outcome:
      | { status: 'signedIn' }
      | {
          status: 'signupRequired';
          socialSignupToken: string;
          suggestedEmail?: string;
          suggestedDisplayName?: string;
        },
  ) => {
    if (outcome.status === 'signedIn') {
      // 세션이 생기면 `(auth)/_layout`의 가드가 알아서 앱 안쪽으로 보낸다.
      return;
    }

    // 계약상 신규 소셜 식별자는 로그인이 아니라 가입 대기다(§12-1). 추가정보 입력으로 잇는다(AUTH-12).
    startSocialSignup({
      provider,
      socialSignupToken: outcome.socialSignupToken,
      suggestedDisplayName: outcome.suggestedDisplayName,
      suggestedEmail: outcome.suggestedEmail,
    });
    onSocialSignupRequired();
  };

  const handleSocialError = (error: unknown) => {
    // 사용자가 직접 닫은 경우엔 아무것도 띄우지 않는다.
    if (isCanceled(error)) {
      return;
    }
    Alert.alert('로그인하지 못했어요', normalizeError(error).message);
  };

  const handleApplePress = () => {
    if (onStartWithApple !== undefined) {
      onStartWithApple();
      return;
    }

    appleSignIn.mutate(undefined, {
      onSuccess: (outcome) => handleSocialOutcome('apple', outcome),
      onError: handleSocialError,
    });
  };

  const handleKakaoPress = () => {
    if (onStartWithKakao !== undefined) {
      onStartWithKakao();
      return;
    }

    kakaoSignIn.mutate(undefined, {
      onSuccess: (outcome) => handleSocialOutcome('kakao', outcome),
      onError: handleSocialError,
    });
  };

  return (
    <Box
      background="background"
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom + SPEC.bottomInset },
      ]}
    >
      {/* 뒤로가기는 없지만 로그인 화면과 높이를 맞추려고 자리는 그대로 둔다. */}
      <AuthHeader />

      <View style={styles.content}>
        <Image
          style={styles.wordmark}
          source={require('@/assets/images/logo-baton-dark.png')}
          contentFit="contain"
          accessibilityLabel="baton"
        />
        <Text
          variant="body"
          weight="medium"
          color="textSecondary"
          style={[textStyles.center, styles.tagline]}
        >
          근무자는 바뀌어도 업무는 끊기지 않게
        </Text>

        <Illustration />

        {/* 시안(852)에서 48이 남는 자리. 화면이 길어지면 여기서 흡수한다. */}
        <View style={styles.spacer} />

        <View style={styles.actions}>
          <View style={styles.socialGroup}>
            <StartButton
              provider="kakao"
              label="카카오로 시작하기"
              onPress={handleKakaoPress}
              isLoading={kakaoSignIn.isPending}
            />
            {canUseApple ? (
              <StartButton
                provider="apple"
                label="Apple로 시작하기"
                onPress={handleApplePress}
                isLoading={appleSignIn.isPending}
                disabled={kakaoSignIn.isPending}
              />
            ) : null}
          </View>
          <OrDivider label="또는" />
          <StartButton
            provider="email"
            label="이메일로 시작하기"
            onPress={onStartWithEmail}
            disabled={isBusy}
          />
        </View>
      </View>
    </Box>
  );
}

/** 시안에서 아직 회색 사각형인 자리. 일러스트가 나오면 이 컴포넌트만 교체한다. */
function Illustration() {
  return (
    <Box
      background="placeholder"
      style={styles.illustration}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  /** 헤더는 자체 여백을 쓰므로 좌우 패딩은 헤더 아래 본문에만 준다. */
  content: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING_X,
  },
  wordmark: {
    width: SPEC.wordmarkWidth,
    aspectRatio: SPEC.wordmarkAspectRatio,
    marginTop: SPEC.wordmarkTop,
    alignSelf: 'center',
  },
  tagline: { marginTop: SPEC.taglineTop },
  illustration: {
    width: SPEC.illustrationWidth,
    height: SPEC.illustrationHeight,
    marginTop: SPEC.illustrationTop,
    alignSelf: 'center',
  },
  spacer: { flex: 1 },
  actions: { gap: SPEC.actionGap },
  socialGroup: { gap: SPEC.socialGap },
});
