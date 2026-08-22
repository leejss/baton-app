import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { radius, spacing, useTheme } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

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
  const theme = useTheme();
  const isDisabled = disabled || isLoading;

  // 브랜드색이 정해지기 전까지 primary는 전경/배경을 뒤집은 중립 버튼으로 둔다.
  const backgroundColor =
    variant === 'primary'
      ? theme.colors.textPrimary
      : variant === 'secondary'
        ? theme.colors.surface
        : 'transparent';

  const labelColor = variant === 'primary' ? 'background' : 'textPrimary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      hitSlop={spacing.sm}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor },
        variant === 'ghost' && { borderColor: theme.colors.border, borderWidth: 1 },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.colors[labelColor]} />
      ) : (
        <Text variant="body" color={labelColor}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    /** 고정 height 대신 minHeight — 폰트 스케일이 커져도 잘리지 않는다. 최소 44pt 터치 영역. */
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
