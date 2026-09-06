import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { buttonMetrics, Text } from '@/shared/ui';
import { EmailLine } from '@/shared/ui/icons';
import { socialBrand, useTheme } from '@/theme';

/**
 * 시작 화면의 로그인 수단 버튼. 시안 `Action Button_square`를 그대로 따르되,
 * 카카오는 카카오의 고정 브랜드 색을 쓰므로 테마를 타지 않는다.
 */
type StartButtonProvider = 'kakao' | 'apple' | 'email';

export type StartButtonProps = {
  provider: StartButtonProvider;
  label: string;
  onPress: () => void;
  /** 진행 중에는 라벨 자리에 인디케이터를 띄우고 중복 탭을 막는다. */
  isLoading?: boolean;
  disabled?: boolean;
};

/**
 * 외부 서비스 로고는 각 사가 정한 색·형태를 그대로 써야 해서 PNG로 둔다.
 * 우리 아이콘셋(글리프)에 없고, 테마에 따라 색이 바뀌어서도 안 된다.
 */
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
      : provider === 'apple'
        ? { backgroundColor: colors.textPrimary }
        : { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderStrong };

  const labelColor =
    provider === 'kakao' ? 'staticBlack' : provider === 'apple' ? 'staticWhite' : 'textSecondary';

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
          {provider === 'email' ? (
            <EmailLine size={buttonMetrics.iconSize} color={labelColor} />
          ) : (
            <Image
              style={styles.icon}
              source={BRAND_ICONS[provider]}
              contentFit="contain"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          )}
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
