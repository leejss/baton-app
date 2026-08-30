import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColorName, type ThemeColors } from '@/theme/colors';
import { shadows, type ShadowName } from '@/theme/shadows';
import { MAX_CONTENT_WIDTH, radius, spacing } from '@/theme/tokens';
import {
  fontFamily,
  fontWeight,
  typography,
  type FontWeightName,
  type TextVariant,
} from '@/theme/typography';

export type Theme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
  fontFamily: typeof fontFamily;
  isDark: boolean;
};

const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  radius,
  typography,
  shadows,
  fontFamily,
  isDark: false,
};

const darkTheme: Theme = { ...lightTheme, colors: darkColors, isDark: true };

/**
 * 다크모드 분기는 여기서만 한다. 컴포넌트는 `useColorScheme()`을 직접 호출하지 않는다.
 */
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}

export { MAX_CONTENT_WIDTH, radius, spacing, shadows, typography, fontFamily, fontWeight };
export type { FontWeightName, ShadowName, TextVariant, ThemeColorName, ThemeColors };
