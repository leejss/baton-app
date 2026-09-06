import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/obra` (530:14575).
 */
export function LockOnFill(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M12 2C14.7523 2 17 4.24772 17 7V10H18C19.1046 10 20 10.8954 20 12V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V12C4.00002 10.8954 4.89544 10 6 10H7V7C7 4.24772 9.24772 2 12 2ZM12 4C10.3523 4 9 5.35228 9 7V10H15V7C15 5.35228 13.6477 4 12 4Z"
        fill={color}
      />
    </Svg>
  );
}
