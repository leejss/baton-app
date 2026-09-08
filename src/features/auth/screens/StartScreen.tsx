import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logger } from '@/shared/lib/logger';
import { Box, Text, textStyles } from '@/shared/ui';
import { SCREEN_PADDING_X } from '@/theme';

import { useSocialSignIn } from '@/features/auth/hooks/useSocialSignIn';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { OrDivider } from '@/features/auth/components/OrDivider';
import { StartButton } from '@/features/auth/components/StartButton';

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
  const social = useSocialSignIn({ onSignupRequired: onSocialSignupRequired });

  const handleKakaoPress = onStartWithKakao ?? social.signInWithKakao;
  const handleApplePress = onStartWithApple ?? social.signInWithApple;

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
              isLoading={social.isKakaoPending}
            />
            {social.canUseApple ? (
              <StartButton
                provider="apple"
                label="Apple로 시작하기"
                onPress={handleApplePress}
                isLoading={social.isApplePending}
                disabled={social.isKakaoPending}
              />
            ) : null}
          </View>
          <OrDivider label="또는" />
          <StartButton
            provider="email"
            label="이메일로 시작하기"
            onPress={onStartWithEmail}
            disabled={social.isPending}
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
