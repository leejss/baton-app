import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/eyes` (530:14589).
 */
export function EyeOnLine(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M12 4.99999C15.9031 4.99999 19.7363 7.23629 21.8945 11.5527C22.0353 11.8343 22.0353 12.1657 21.8945 12.4473C19.7363 16.7637 15.9031 19 12 19C8.09687 19 4.26369 16.7637 2.10547 12.4473C1.9647 12.1657 1.9647 11.8343 2.10547 11.5527C4.26369 7.23629 8.09687 4.99999 12 4.99999ZM12 6.99999C9.03136 6.99999 5.99928 8.62112 4.13086 12C5.99928 15.3789 9.03136 17 12 17C14.9685 17 17.9997 15.3786 19.8682 12C17.9997 8.6214 14.9685 6.99999 12 6.99999Z"
        fill={color}
      />
      <Path
        d="M12 15C13.6569 15 15 13.6568 15 12C15 10.3431 13.6569 8.99999 12 8.99999C10.3431 8.99999 9 10.3431 9 12C9 13.6568 10.3431 15 12 15Z"
        fill={color}
      />
    </Svg>
  );
}
