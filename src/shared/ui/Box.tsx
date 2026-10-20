import { View, type ViewProps } from 'react-native';

import { useTheme, type ThemeColorName } from '@/theme';

type BoxProps = ViewProps & {
  background?: ThemeColorName;
};

export function Box({ style, background, ...rest }: BoxProps) {
  const theme = useTheme();

  return (
    <View
      style={[background !== undefined && { backgroundColor: theme.colors[background] }, style]}
      {...rest}
    />
  );
}
