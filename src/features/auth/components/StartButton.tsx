import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { buttonMetrics, Text } from '@/shared/ui';
import { socialBrand, useTheme } from '@/theme';

type StartButtonProvider = 'kakao' | 'apple';

type StartButtonProps = {
  provider: StartButtonProvider;
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
};

const BRAND_ICONS = {
  kakao: require('@/assets/images/icon-kakao.png'),
  apple: require('@/assets/images/icon-apple.png'),
} as const;

export function StartButton({
  provider,
  label,
  onPress,
  isLoading = false,
  disabled = false,
}: StartButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || isLoading;

  const containerStyle =
    provider === 'kakao'
      ? { backgroundColor: socialBrand.kakaoYellow }
      : { backgroundColor: colors.surfaceNeutralStrong };
  const labelColor = provider === 'kakao' ? 'staticBlack' : 'staticWhite';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        containerStyle,
        pressed && styles.pressed,
        isDisabled && !isLoading && styles.disabled,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={colors[labelColor]} />
      ) : (
        <>
          <Image
            style={styles.icon}
            source={BRAND_ICONS[provider]}
            contentFit="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text variant="body" weight="semibold" color={labelColor}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: buttonMetrics.minHeight,
    borderRadius: buttonMetrics.radius,
    paddingHorizontal: buttonMetrics.paddingHorizontal,
    paddingVertical: buttonMetrics.paddingVertical,
    gap: buttonMetrics.gap,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  icon: { width: buttonMetrics.iconSize, height: buttonMetrics.iconSize },
});
