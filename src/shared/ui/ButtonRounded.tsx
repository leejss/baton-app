import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { radius, useTheme, type ThemeColorName, type TextVariant } from '@/theme';

/**
 * 알약 모양 액션 버튼. Figma `Action Button_rounded`(1169:29426)를 옮긴 것이다.
 *
 * 사각 버튼(`Button`)과 **배색 체계가 다르다.** 사각은 색을 꽉 채운 솔리드가 기본이고,
 * 라운드는 옅은 배경 + 진한 글자인 톤 배색이 기본이다. 그래서 축을 공유하지 않고
 * 컴포넌트를 나눴다 — 한 컴포넌트에 합치면 `color`가 두 의미를 갖게 된다.
 *
 * @example
 * <ButtonRounded label="전체" tone="grey" size="sm" />
 * <ButtonRounded label="확인" tone="blue" />
 * <ButtonRounded label="삭제" tone="red" size="lg" />
 */
export type ButtonRoundedTone = 'black' | 'grey' | 'blue' | 'red';

/** 시안 그대로. `lg`가 가장 크다(48). 사각 버튼의 `bg`와 이름이 다르니 주의. */
export type ButtonRoundedSize = 'sm' | 'md' | 'lg';

export type ButtonRoundedProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  tone?: ButtonRoundedTone;
  size?: ButtonRoundedSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

/**
 * 사이즈별 치수. 시안 실측이다.
 *
 * ⚠️ `md`는 시안에서 높이가 40으로 고정돼 있는데 안의 글자가 `body`(16/28)에
 * 상하 여백 8이라 실제로는 44가 나온다. Figma에서도 `overflow-clip`으로 잘려 있다.
 * `sm`이 `bodySmall`인 것과도 어긋나서 디자인 확인이 필요하다.
 * 여기서는 글자가 잘리지 않도록 고정 높이 대신 `minHeight`로 두고 시안 값을 그대로 쓴다.
 */
const SIZES: Record<
  ButtonRoundedSize,
  { minHeight: number; paddingHorizontal: number; paddingVertical: number; text: TextVariant }
> = {
  sm: { minHeight: 36, paddingHorizontal: 10, paddingVertical: 6, text: 'bodySmall' },
  md: { minHeight: 40, paddingHorizontal: 12, paddingVertical: 8, text: 'body' },
  lg: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, text: 'body' },
};

const GAP = 8;

type Skin = { background: ThemeColorName; label: ThemeColorName };

const TONES: Record<ButtonRoundedTone, Skin> = {
  /** `surface/neutral/strong` + `foreground/inverse`. */
  black: { background: 'surfaceNeutralStrong', label: 'foregroundInverse' },
  /** `surface/neutral/medium` + `foreground/default`. */
  grey: { background: 'surfaceNeutralMedium', label: 'foregroundDefault' },
  /** `surface/blue/default` + `foreground/blue/soft`. */
  blue: { background: 'surfaceBlueDefault', label: 'foregroundBlueSoft' },
  /** `surface/warning/soft` + `foreground/warning/default`. */
  red: { background: 'surfaceWarningSoft', label: 'foregroundWarningDefault' },
};

/** 시안 `color=Default, state=Disabled`. 톤과 무관하게 하나다. */
const DISABLED: Skin = { background: 'surfaceNeutralDisabled', label: 'foregroundDisabled' };

export function ButtonRounded({
  label,
  tone = 'grey',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  ...rest
}: ButtonRoundedProps) {
  const { colors } = useTheme();

  const isBlocked = disabled || isLoading;
  const isMuted = disabled && !isLoading;
  const skin = isMuted ? DISABLED : TONES[tone];
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
          paddingVertical: metrics.paddingVertical,
          backgroundColor: colors[skin.background],
        },
        // 시안에 pressed 배색이 없다. 사각 버튼처럼 색을 바꾸지 않고 투명도로만 눌림을 알린다.
        pressed && styles.pressed,
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

const styles = StyleSheet.create({
  base: {
    /** 시안은 42지만 어떤 높이에서도 알약이 되도록 full을 쓴다. 48 이하에서 결과가 같다. */
    borderRadius: radius.full,
    gap: GAP,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  pressed: { opacity: 0.7 },
});
