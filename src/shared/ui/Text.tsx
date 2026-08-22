import { StyleSheet, Text as RNText, type TextProps } from 'react-native';

import { useTheme, type TextVariant, type ThemeColorName } from '@/theme';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: ThemeColorName;
};

/**
 * 앱 전역 텍스트. RN의 `Text`를 직접 쓰지 않고 항상 이 컴포넌트를 쓴다.
 * `allowFontScaling`은 기본값(true)을 유지한다 — 끄지 않는다.
 */
export function Text({ style, variant = 'body', color = 'textPrimary', ...rest }: AppTextProps) {
  const theme = useTheme();

  return (
    <RNText style={[theme.typography[variant], { color: theme.colors[color] }, style]} {...rest} />
  );
}

export const textStyles = StyleSheet.create({
  center: { textAlign: 'center' },
});
