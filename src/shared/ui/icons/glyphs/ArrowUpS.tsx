import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/arrow-up-s-line` (90:1553).
 */
export function ArrowUpS(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M11.9999 10.8284L7.7573 15.0711C7.36678 15.4616 6.73362 15.4616 6.34309 15.0711C5.95257 14.6806 5.95257 14.0474 6.34308 13.6569L11.2928 8.70712C11.6833 8.31659 12.3165 8.31659 12.707 8.70711L17.6568 13.6569C18.0473 14.0474 18.0473 14.6806 17.6568 15.0711C17.2663 15.4616 16.6331 15.4616 16.2426 15.0711L11.9999 10.8284Z"
        fill={color}
      />
    </Svg>
  );
}
