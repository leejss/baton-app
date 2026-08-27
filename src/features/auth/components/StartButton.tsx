import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui';
import { radius, socialBrand, spacing, useTheme } from '@/theme';

/**
 * 시작 화면의 로그인 수단 버튼. 카카오·Apple은 각 사의 고정 브랜드 색을 쓰므로
 * 테마를 타지 않고, 이메일만 우리 테마의 배경/테두리를 따른다.
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

const ICON_SIZE = 24;
/** 시안의 이메일 버튼 아이콘 자리는 아직 회색 원이다. 지름만 24가 아니라 25다. */
const EMAIL_PLACEHOLDER_SIZE = 25;

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
        ? { backgroundColor: colors.staticBlack }
        : { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.textPrimary };

  const labelColor = provider === 'apple' ? 'staticWhite' : 'staticBlack';

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
      ) : provider === 'email' ? (
        <View style={[styles.emailPlaceholder, { backgroundColor: colors.placeholder }]} />
      ) : (
        <Image
          style={styles.icon}
          source={
            provider === 'kakao'
              ? require('@/assets/images/icon-kakao.png')
              : require('@/assets/images/icon-apple.png')
          }
          contentFit="contain"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}
      {!isLoading && (
        <Text variant="button" color={labelColor}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    /** 고정 height 대신 minHeight — 폰트 스케일이 커져도 라벨이 잘리지 않는다. */
    minHeight: 48,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  icon: { width: ICON_SIZE, height: ICON_SIZE },
  emailPlaceholder: {
    width: EMAIL_PLACEHOLDER_SIZE,
    height: EMAIL_PLACEHOLDER_SIZE,
    borderRadius: EMAIL_PLACEHOLDER_SIZE / 2,
  },
});
