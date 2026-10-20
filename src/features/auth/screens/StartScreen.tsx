import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Text, textStyles } from '@/shared/ui';
import { SCREEN_PADDING_X } from '@/theme';

import { useSocialSignIn } from '@/features/auth/hooks/useSocialSignIn';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { StartButton } from '@/features/auth/components/StartButton';

const SPEC = {
  wordmarkTop: 18,
  wordmarkWidth: 153,
  wordmarkAspectRatio: 153 / 42,
  taglineTop: 12,
  illustrationTop: 48,
  illustrationLeft: -60,
  illustrationWidth: 582,
  illustrationHeight: 386,
  socialGap: 10,
  bottomInset: 55,
} as const;

type StartScreenProps = { onSocialSignupRequired: () => void };

export function StartScreen({ onSocialSignupRequired }: StartScreenProps) {
  const insets = useSafeAreaInsets();
  const social = useSocialSignIn({ onSignupRequired: onSocialSignupRequired });

  return (
    <Box
      background="backgroundDefault"
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom + SPEC.bottomInset,
        },
      ]}
    >
      <AuthHeader />

      <View style={styles.content}>
        <Image
          style={styles.illustration}
          source={require('@/assets/images/auth/start-illustration.png')}
          contentFit="contain"
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />

        <View style={styles.body}>
          <Image
            style={styles.wordmark}
            source={require('@/assets/images/logo-baton-dark.png')}
            contentFit="contain"
            accessibilityLabel="baton"
          />
          <Text
            variant="body"
            weight="medium"
            color="foregroundDefault"
            style={[textStyles.center, styles.tagline]}
          >
            근무자는 바뀌어도 업무는 끊기지 않게
          </Text>
          <View style={styles.spacer} />

          <View style={styles.socialGroup}>
            <StartButton
              provider="kakao"
              label="카카오로 시작하기"
              onPress={social.signInWithKakao}
              isLoading={social.isKakaoPending}
              disabled={social.isPending}
            />
            {social.canUseApple ? (
              <StartButton
                provider="apple"
                label="Apple로 시작하기"
                onPress={social.signInWithApple}
                isLoading={social.isApplePending}
                disabled={social.isPending}
              />
            ) : null}
          </View>
        </View>
      </View>
    </Box>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  body: {
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
    position: 'absolute',
    top: SPEC.illustrationTop,
    left: SPEC.illustrationLeft,
    width: SPEC.illustrationWidth,
    height: SPEC.illustrationHeight,
  },
  spacer: { flex: 1 },
  socialGroup: { gap: SPEC.socialGap },
});
