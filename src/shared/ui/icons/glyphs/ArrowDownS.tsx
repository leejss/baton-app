import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/arrow-down-s-line` (90:1552).
 */
export function ArrowDownS(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M11.9999 13.1714L16.2426 8.92878C16.6331 8.53826 17.2663 8.53826 17.6568 8.92878C18.0473 9.31931 18.0473 9.95247 17.6568 10.343L12.707 15.2928C12.3165 15.6833 11.6833 15.6833 11.2928 15.2928L6.34309 10.343C5.95257 9.95247 5.95257 9.31931 6.34309 8.92879C6.73362 8.53826 7.36678 8.53826 7.75731 8.92879L11.9999 13.1714Z"
        fill={color}
      />
    </Svg>
  );
}
