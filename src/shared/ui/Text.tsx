import { StyleSheet, Text as RNText, type TextProps } from 'react-native';

import { useTheme, type FontWeightName, type TextVariant, type ThemeColorName } from '@/theme';

export type AppTextProps = TextProps & {
  /** Figma 타입 스케일의 역할. `displayLarge` ~ `caption`. */
  variant?: TextVariant;
  /** 같은 역할 안에서의 굵기. Figma 그리드의 두 번째 축이다. */
  weight?: FontWeightName;
  color?: ThemeColorName;
};

/**
 * 앱 전역 텍스트. RN의 `Text`를 직접 쓰지 않고 항상 이 컴포넌트를 쓴다.
 * `allowFontScaling`은 기본값(true)을 유지한다 — 끄지 않는다.
 */
export function Text({
  style,
  variant = 'body',
  weight = 'regular',
  color = 'textPrimary',
  ...rest
}: AppTextProps) {
  const theme = useTheme();

  return (
    <RNText
      style={[theme.typography[variant][weight], { color: theme.colors[color] }, style]}
      {...rest}
    />
  );
}

export const textStyles = StyleSheet.create({
  center: { textAlign: 'center' },
});
