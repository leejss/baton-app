import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/obra` (530:14575).
 */
export function LockOnLine(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M5.99999 12V20H18V12H5.99999ZM20 20C20 21.1046 19.1046 22 18 22H5.99999C4.89542 22 3.99999 21.1046 3.99999 20V12C3.99999 10.8955 4.89542 10 5.99999 10H18C19.1046 10 20 10.8955 20 12V20Z"
        fill={color}
      />
      <Path
        d="M15 7C15 5.35228 13.6477 4 12 4C10.3523 4 8.99999 5.35228 8.99999 7V10H15V7ZM17 11C17 11.5523 16.5523 12 16 12H7.99999C7.44771 12 6.99999 11.5523 6.99999 11V7C6.99999 4.24772 9.24771 2 12 2C14.7523 2 17 4.24772 17 7V11Z"
        fill={color}
      />
    </Svg>
  );
}
