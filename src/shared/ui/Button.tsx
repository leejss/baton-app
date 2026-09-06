import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { radius, useTheme } from '@/theme';

/**
 * 시안이 활성 CTA에 두 배색을 쓴다.
 *   primary  #1F2937 — 로그인, "로그인하러 가기"
 *   accent   #2563EB — 비밀번호 재설정 플로우의 진행 버튼
 * 비활성 배색(#E5E7EB / #9CA3AF)은 둘이 같다.
 */
type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost';

/**
 * 시안 `Action Button_square`의 치수. 시작 화면의 소셜 버튼(`StartButton`)도 같은
 * 컴포넌트에서 파생된 모양이라 이 값을 함께 쓴다. 한쪽만 고치면 두 화면이 어긋난다.
 */
export const buttonMetrics = {
  /** 시안은 48 고정. 폰트 스케일이 커져도 라벨이 잘리지 않도록 minHeight로 쓴다. */
  minHeight: 48,
  radius: radius.sm,
  paddingHorizontal: 20,
  paddingVertical: 10,
  /** 아이콘과 라벨 사이. */
  gap: 8,
  iconSize: 26,
} as const;

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  isLoading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || isLoading;
  // 진행 중에는 눌린 상태를 유지하는 게 맞아서 비활성 배색을 입히지 않는다.
  const isMuted = disabled && !isLoading;

  /**
   * Figma에 `Action Button`(tonal pill) / `Action Button_Black`(solid) 두 계열이 있지만
   * 아직 확정 전이라 여기 옮기지 않는다. 확정되면 사이즈(sm/md/lg)와 pressed 색까지
   * 함께 들어온다. 그때까지는 로그인 시안이 실제로 쓰는 두 배색만 둔다.
   */
  const containerStyle =
    variant === 'primary' || variant === 'accent'
      ? {
          backgroundColor: isMuted
            ? colors.surfaceDisabled
            : variant === 'primary'
              ? colors.textPrimary
              : colors.accent,
        }
      : variant === 'secondary'
        ? /** 회원가입 시안의 "인증번호 재전송" 비활성 배색(#F3F4F6 / #9CA3AF). */
          { backgroundColor: isMuted ? colors.surfaceSunken : colors.surface }
        : { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderStrong };

  const labelColor = isMuted
    ? variant === 'secondary'
      ? 'textDisabled'
      : 'textTertiary'
    : variant === 'primary' || variant === 'accent'
      ? 'staticWhite'
      : variant === 'secondary'
        ? 'textPrimary'
        : 'textSecondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      style={({ pressed }) => [styles.base, containerStyle, pressed && styles.pressed]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={colors[labelColor]} />
      ) : (
        <Text variant="body" weight="semibold" color={labelColor}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: buttonMetrics.minHeight,
    borderRadius: buttonMetrics.radius,
    paddingHorizontal: buttonMetrics.paddingHorizontal,
    paddingVertical: buttonMetrics.paddingVertical,
    gap: buttonMetrics.gap,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  pressed: { opacity: 0.7 },
});
