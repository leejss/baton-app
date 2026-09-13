import { appColors, type ThemeColorName, type ThemeColors } from '@/theme/colors';
import { shadows, type ShadowName } from '@/theme/shadows';
import { MAX_CONTENT_WIDTH, radius, SCREEN_PADDING_X, socialBrand, spacing } from '@/theme/tokens';
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
};

const appTheme: Theme = {
  colors: appColors,
  spacing,
  radius,
  typography,
  shadows,
  fontFamily,
};

/**
 * 앱은 Figma 디자인 시스템에 맞춰 라이트모드 하나만 사용한다.
 */
export function useTheme(): Theme {
  return appTheme;
}

export {
  MAX_CONTENT_WIDTH,
  radius,
  SCREEN_PADDING_X,
  socialBrand,
  spacing,
  shadows,
  typography,
  fontFamily,
  fontWeight,
};
export type { FontWeightName, ShadowName, TextVariant, ThemeColorName, ThemeColors };
