import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/email` (530:14608).
 */
export function EmailLine(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M4 5.99999V18H20V5.99999H4ZM22 18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V5.99999C2 4.89542 2.89543 3.99999 4 3.99999H20C21.1046 3.99999 22 4.89542 22 5.99999V18Z"
        fill={color}
      />
      <Path
        d="M19.3418 5.24707C19.7574 4.88372 20.3893 4.92628 20.7529 5.3418C21.1163 5.75744 21.0737 6.38935 20.6582 6.75293L12.6582 13.7529C12.2813 14.0824 11.7187 14.0824 11.3418 13.7529L3.34179 6.75293C2.92627 6.38935 2.88371 5.75744 3.24707 5.3418C3.61065 4.92628 4.24256 4.88372 4.6582 5.24707L12 11.6709L19.3418 5.24707Z"
        fill={color}
      />
    </Svg>
  );
}
