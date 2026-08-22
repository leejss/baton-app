import { View, type ViewProps } from 'react-native';

import { useTheme, type ThemeColorName } from '@/theme';

export type BoxProps = ViewProps & {
  /** 배경에 쓸 시맨틱 컬러. 생략하면 배경을 칠하지 않는다(투명). */
  background?: ThemeColorName;
};

/**
 * 테마 배경을 입힌 컨테이너. 배경이 필요 없으면 RN `View`를 그대로 써도 된다.
 */
export function Box({ style, background, ...rest }: BoxProps) {
  const theme = useTheme();

  return (
    <View
      style={[background !== undefined && { backgroundColor: theme.colors[background] }, style]}
      {...rest}
    />
  );
}
