import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/email` (530:14608).
 */
export function EmailFill(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M20 4C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4H20ZM19.5645 6.50586C19.2917 6.19426 18.8175 6.16283 18.5059 6.43555L12 12.0029L5.49414 6.43555C5.18246 6.16283 4.70833 6.19426 4.43555 6.50586C4.16283 6.81754 4.19426 7.29167 4.50586 7.56445L11.5059 13.5645C11.7886 13.8119 12.2114 13.8119 12.4941 13.5645L19.4941 7.56445C19.8057 7.29167 19.8372 6.81754 19.5645 6.50586Z"
        fill={color}
      />
    </Svg>
  );
}
