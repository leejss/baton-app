import { Image } from 'expo-image';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';
import { Box, Text, textStyles } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing } from '@/theme';

import { isCanceled, useKakaoSignIn } from '@/features/auth/api/auth.mutations';
import { OrDivider } from '@/features/auth/components/OrDivider';
import { StartButton } from '@/features/auth/components/StartButton';

/**
 * 세로 리듬은 Figma "시작(로그인 선택) 화면"(393×852) 실측값이다.
 *
 * 시안이 2px 그리드를 쓰는데 `spacing` 스케일은 4px 배수라 그대로 매핑되지 않는다.
 * 전역 스케일을 이 화면 하나 때문에 늘리는 대신, 시안에서 온 값임을 밝히고 여기 모아둔다.
 * 디자인의 간격 스케일이 확정되면 `spacing`으로 흡수한다.
 */
const SPEC = {
  /** 상태바 하단(44) → 로고 상단(145). */
  logoTop: 101,
  logoWidth: 129,
  logoAspectRatio: 129 / 36.5,
  /** 로고 하단(181.5) → 태그라인 상단(192.6). */
  taglineTop: 11,
  /** 태그라인 하단(216.6) → 원 상단(258). */
  illustrationTop: 41,
  illustrationSize: 214,
  /** 버튼·구분선 사이 간격. 시안은 11~12로 섞여 있어 12로 통일했다. */
  actionGap: 12,
  /** 이메일 버튼 하단(762) → 푸터 상단(781). */
  footerTop: 20,
  /** 푸터 하단(798) → 홈 인디케이터 영역 시작(818). */
  bottomInset: 20,
} as const;

export type StartScreenProps = {
  /** 테스트에서 카카오 SDK를 타지 않고 눌림만 확인할 때 주입한다. */
  onStartWithKakao?: () => void;
  onStartWithApple?: () => void;
  onStartWithEmail?: () => void;
  onSignUp?: () => void;
};

/** 아직 연결할 화면·API가 없는 동작. 조용히 삼키지 않고 로그로 남긴다. */
function notWired(action: string) {
  return () => logger.warn('시작 화면 동작이 아직 연결되지 않았습니다', { action });
}

export function StartScreen({
  onStartWithKakao,
  onStartWithApple = notWired('apple'),
  onStartWithEmail = notWired('email'),
  onSignUp = notWired('signUp'),
}: StartScreenProps) {
  const insets = useSafeAreaInsets();
  const kakaoSignIn = useKakaoSignIn();

  const handleKakaoPress = () => {
    if (onStartWithKakao !== undefined) {
      onStartWithKakao();
      return;
    }

    kakaoSignIn.mutate(undefined, {
      onError: (error) => {
        // 사용자가 직접 닫은 경우엔 아무것도 띄우지 않는다.
        if (isCanceled(error)) {
          return;
        }
        Alert.alert('로그인하지 못했어요', normalizeError(error).message);
      },
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
      <Image
        style={styles.logo}
        source={require('@/assets/images/logo-baton-dark.png')}
        contentFit="contain"
        accessibilityLabel="baton"
      />
      <Text variant="tagline" style={[textStyles.center, styles.tagline]}>
        근무자는 바뀌어도 업무는 끊기지 않게
      </Text>

      <Illustration />

      <View style={styles.spacer} />

      <View style={styles.actions}>
        <StartButton
          provider="kakao"
          label="카카오로 시작하기"
          onPress={handleKakaoPress}
          isLoading={kakaoSignIn.isPending}
        />
        <StartButton
          provider="apple"
          label="Apple로 시작하기"
          onPress={onStartWithApple}
          disabled={kakaoSignIn.isPending}
        />
        <OrDivider label="또는" />
        <StartButton
          provider="email"
          label="이메일로 시작하기"
          onPress={onStartWithEmail}
          disabled={kakaoSignIn.isPending}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="footnote" color="textSecondary">
          아직 회원이 아니신가요?
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="회원가입"
          onPress={onSignUp}
          hitSlop={spacing.md}
        >
          <Text variant="footnoteStrong">회원가입</Text>
        </Pressable>
      </View>
    </Box>
  );
}

/** 시안에서 아직 회색 원인 자리. 일러스트가 나오면 이 컴포넌트만 교체한다. */
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
  root: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING_X,
  },
  logo: {
    width: SPEC.logoWidth,
    aspectRatio: SPEC.logoAspectRatio,
    marginTop: SPEC.logoTop,
    alignSelf: 'center',
  },
  tagline: { marginTop: SPEC.taglineTop },
  illustration: {
    width: SPEC.illustrationSize,
    height: SPEC.illustrationSize,
    borderRadius: SPEC.illustrationSize / 2,
    marginTop: SPEC.illustrationTop,
    alignSelf: 'center',
  },
  /** 남는 세로 공간을 전부 흡수해 버튼 묶음을 하단에 붙인다. */
  spacer: { flex: 1 },
  actions: { gap: SPEC.actionGap },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: SPEC.footerTop,
  },
});
