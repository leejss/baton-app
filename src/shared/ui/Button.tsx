import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { radius, useTheme, type ThemeColorName, type TextVariant } from '@/theme';

type ButtonColor = 'black' | 'blue' | 'red';

type ButtonSize = 'sm' | 'md' | 'bg';

type ButtonTone = 'solid' | 'weak';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  color?: ButtonColor;
  size?: ButtonSize;
  tone?: ButtonTone;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const SIZES: Record<
  ButtonSize,
  { minHeight: number; paddingHorizontal: number; text: TextVariant }
> = {
  sm: { minHeight: 36, paddingHorizontal: 12, text: 'caption' },
  md: { minHeight: 40, paddingHorizontal: 16, text: 'bodySmall' },
  bg: { minHeight: 48, paddingHorizontal: 20, text: 'body' },
};

const PADDING_VERTICAL = 10;
const GAP = 8;

type Skin = {
  background: ThemeColorName;
  pressedBackground: ThemeColorName;
  label: ThemeColorName;
};

const SOLID: Record<ButtonColor, Skin> = {
  black: {
    background: 'surfaceNeutralStrong',
    pressedBackground: 'surfaceNeutralPressed',
    label: 'foregroundInverse',
  },
  blue: {
    background: 'surfaceBlueStrong',
    pressedBackground: 'surfaceBluePressed',
    label: 'foregroundInverse',
  },
  red: {
    background: 'surfaceWarningDefault',
    pressedBackground: 'surfaceWarningPressed',
    label: 'foregroundInverse',
  },
};

const WEAK: Skin = {
  background: 'surfaceNeutralSubtle',
  pressedBackground: 'surfaceNeutralDisabled',
  label: 'foregroundDisabled',
};

const DISABLED: Skin = {
  background: 'surfaceNeutralDisabled',
  pressedBackground: 'surfaceNeutralDisabled',
  label: 'foregroundDisabled',
};

export function Button({
  label,
  color = 'black',
  size = 'bg',
  tone = 'solid',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();

  const isBlocked = disabled || isLoading;
  // 진행 중에는 눌린 상태를 유지하는 게 맞아서 비활성 배색을 입히지 않는다.
  const isMuted = disabled && !isLoading;

  const skin = isMuted ? DISABLED : tone === 'weak' ? WEAK : SOLID[color];
  const metrics = SIZES[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isBlocked, busy: isLoading }}
      disabled={isBlocked}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: metrics.minHeight,
          paddingHorizontal: metrics.paddingHorizontal,
          backgroundColor: colors[pressed ? skin.pressedBackground : skin.background],
        },
      ]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={colors[skin.label]} />
      ) : (
        <>
          {leftIcon}
          <Text variant={metrics.text} weight="semibold" color={skin.label}>
            {label}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

export const buttonMetrics = {
  minHeight: SIZES.bg.minHeight,
  radius: radius.sm,
  paddingHorizontal: SIZES.bg.paddingHorizontal,
  paddingVertical: PADDING_VERTICAL,
  gap: GAP,
  iconSize: 26,
} as const;

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    paddingVertical: PADDING_VERTICAL,
    gap: GAP,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
