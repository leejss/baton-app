import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/obra/filter` (530:14621).
 */
export function Filter(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M22 2.5C22.3893 2.5 22.7434 2.72594 22.9072 3.0791C23.071 3.43219 23.0149 3.84825 22.7637 4.14551L15 13.3252V21.5C15 21.8466 14.8202 22.1684 14.5254 22.3506C14.2306 22.5327 13.8626 22.5495 13.5527 22.3945L9.55273 20.3945C9.21395 20.2251 9 19.8788 9 19.5V13.3252L1.23633 4.14551C0.985064 3.84825 0.928961 3.43219 1.09277 3.0791C1.25663 2.72594 1.61067 2.5 2 2.5H22ZM10.7637 12.3145C10.9162 12.4949 11 12.7236 11 12.96V18.8818L13 19.8818V12.96C13 12.7236 13.0838 12.4949 13.2363 12.3145L19.8447 4.5H4.15527L10.7637 12.3145Z"
        fill={color}
      />
    </Svg>
  );
}
