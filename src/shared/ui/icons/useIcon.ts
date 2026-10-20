import type { SvgProps } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useTheme } from '@/theme';

type UseIconResult = {
  color: string;
  svgProps: SvgProps;
};

export function useIcon(
  { size = 24, color = 'foregroundStrong', label, style }: IconProps,
  viewBox = '0 0 24 24',
): UseIconResult {
  const theme = useTheme();

  const isDecorative = label === undefined;

  return {
    color: theme.colors[color],
    svgProps: {
      width: size,
      height: size,
      viewBox,
      style,
      accessible: !isDecorative,
      accessibilityRole: isDecorative ? undefined : 'image',
      accessibilityLabel: label,
      accessibilityElementsHidden: isDecorative,
      importantForAccessibility: isDecorative ? 'no-hide-descendants' : 'yes',
    },
  };
}
