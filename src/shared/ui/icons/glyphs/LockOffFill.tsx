import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/obra` (530:14575).
 */
export function LockOffFill(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4C10.3523 4 9 5.35228 9 7V11C9 11.5523 8.55228 12 8 12C7.44772 12 7 11.5523 7 11V7C7 4.24772 9.24772 2 12 2C14.7523 2 17 4.24772 17 7C17 7.55228 16.5523 8 16 8C15.4477 8 15 7.55228 15 7C15 5.35228 13.6477 4 12 4Z"
        fill={color}
      />
      <Path
        d="M4 12C4 10.8954 4.89543 10 6 10H18C19.1046 10 20 10.8954 20 12V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V12Z"
        fill={color}
      />
    </Svg>
  );
}
