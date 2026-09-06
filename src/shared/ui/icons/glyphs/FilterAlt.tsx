import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/obra/filter-alt` (530:14619).
 */
export function FilterAlt(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M17 11C17.5523 11 18 11.4477 18 12C18 12.5523 17.5523 13 17 13H7C6.44772 13 6 12.5523 6 12C6 11.4477 6.44772 11 7 11H17Z"
        fill={color}
      />
      <Path
        d="M19 6C19.5523 6 20 6.44772 20 7C20 7.55228 19.5523 8 19 8H5C4.44772 8 4 7.55228 4 7C4 6.44772 4.44772 6 5 6H19Z"
        fill={color}
      />
      <Path
        d="M15 16C15.5523 16 16 16.4477 16 17C16 17.5523 15.5523 18 15 18H9C8.44772 18 8 17.5523 8 17C8 16.4477 8.44772 16 9 16H15Z"
        fill={color}
      />
    </Svg>
  );
}
