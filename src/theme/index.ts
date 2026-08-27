import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColorName, type ThemeColors } from '@/theme/colors';
import { MAX_CONTENT_WIDTH, radius, SCREEN_PADDING_X, socialBrand, spacing } from '@/theme/tokens';
import { fonts, typography, type TextVariant } from '@/theme/typography';

export type Theme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  fonts: typeof fonts;
  isDark: boolean;
};

const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  radius,
  typography,
  fonts,
  isDark: false,
};

const darkTheme: Theme = { ...lightTheme, colors: darkColors, isDark: true };

/**
 * 다크모드 분기는 여기서만 한다. 컴포넌트는 `useColorScheme()`을 직접 호출하지 않는다.
 */
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}

export { MAX_CONTENT_WIDTH, radius, SCREEN_PADDING_X, socialBrand, spacing, typography, fonts };
export type { ThemeColorName, ThemeColors, TextVariant };
