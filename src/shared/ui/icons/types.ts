import type { StyleProp, ViewStyle } from 'react-native';

import type { ThemeColorName } from '@/theme';

export type IconProps = {
  size?: number;
  color?: ThemeColorName;
  /** 생략하면 장식용 아이콘으로 접근성 트리에서 숨긴다. */
  label?: string;
  style?: StyleProp<ViewStyle>;
};
