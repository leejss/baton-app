import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { radius, useTheme, type ThemeColorName, type TextVariant } from '@/theme';

/**
 * 사각 액션 버튼. Figma `Action Button_square`(1169:28103)를 그대로 옮긴 것이다.
 *
 * 시안은 세 축의 조합이다.
 *   color  Black · Blue · Red
 *   size   sm(36) · md(40) · bg(48)
 *   tone   solid(색 채움) · weak(중립 옅은 배경)
 * 여기에 `isLoading`(시안 `Roading`)과 `disabled`(시안 `Disabled`)가 상태로 붙는다.
 * `Pressed`는 RN의 `pressed`로 처리한다.
 *
 * 라운드 버전은 배색 체계가 아예 달라서 별도 컴포넌트다 — `ButtonRounded`.
 *
 * @example
 * <Button label="다음" />                              // Black · bg
 * <Button label="확인" color="blue" size="md" />
 * <Button label="삭제" color="red" size="sm" />
 * <Button label="재전송" tone="weak" size="md" />
 */
export type ButtonColor = 'black' | 'blue' | 'red';

/** 시안 그대로의 이름이다. `bg`가 가장 크다(48). */
export type ButtonSize = 'sm' | 'md' | 'bg';

export type ButtonTone = 'solid' | 'weak';

/**
 * @deprecated 디자인 시스템 확정 전에 쓰던 축이다. `color`/`tone`으로 옮겨간다.
 * 기존 호출부를 한 번에 고치지 않으려고 남겨 뒀고, 새 코드에서는 쓰지 않는다.
 */
type LegacyVariant = 'primary' | 'accent' | 'secondary' | 'ghost';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  color?: ButtonColor;
  size?: ButtonSize;
  tone?: ButtonTone;
  isLoading?: boolean;
  /** 라벨 왼쪽·오른쪽 슬롯. 시안의 "좌측/우측 아이콘 + 텍스트" 배리언트에 대응한다. */
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** @deprecated `color`/`tone`을 쓸 것. */
  variant?: LegacyVariant;
};

/** 사이즈별 치수. 값은 전부 시안 실측이다. 높이는 좌우 여백 + 라인하이트로 결정된다. */
const SIZES: Record<
  ButtonSize,
  { minHeight: number; paddingHorizontal: number; text: TextVariant }
> = {
  sm: { minHeight: 36, paddingHorizontal: 12, text: 'caption' },
  md: { minHeight: 40, paddingHorizontal: 16, text: 'bodySmall' },
  bg: { minHeight: 48, paddingHorizontal: 20, text: 'body' },
};

/** 전 사이즈 공통. 시안이 상하 10으로 통일돼 있다. */
const PADDING_VERTICAL = 10;
/** 아이콘 ↔ 라벨. */
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

/** 시안의 `state=Weak` · `state=Disabled`. 색과 무관하게 공통이라 하나만 둔다. */
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

/** 옛 `variant`를 새 축으로 옮긴다. 호출부를 다 고치면 이 함수와 함께 사라진다. */
function fromLegacy(variant: LegacyVariant): { color: ButtonColor; tone: ButtonTone } {
  switch (variant) {
    case 'accent':
      return { color: 'blue', tone: 'solid' };
    case 'secondary':
    case 'ghost':
      return { color: 'black', tone: 'weak' };
    default:
      return { color: 'black', tone: 'solid' };
  }
}

export function Button({
  label,
  color,
  size = 'bg',
  tone,
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  variant,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();

  const legacy = variant === undefined ? null : fromLegacy(variant);
  const resolvedColor = color ?? legacy?.color ?? 'black';
  const resolvedTone = tone ?? legacy?.tone ?? 'solid';

  const isBlocked = disabled || isLoading;
  // 진행 중에는 눌린 상태를 유지하는 게 맞아서 비활성 배색을 입히지 않는다.
  const isMuted = disabled && !isLoading;

  const skin = isMuted ? DISABLED : resolvedTone === 'weak' ? WEAK : SOLID[resolvedColor];
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

/**
 * 시안 `Action Button_square`의 치수. 같은 모양에서 파생된 화면 컴포넌트
 * (시작 화면의 소셜 버튼 등)가 함께 참조한다. 한쪽만 고치면 화면이 어긋난다.
 */
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
