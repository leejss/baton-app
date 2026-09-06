import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/obra/search` (530:19768).
 */
export function Search(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M16 10C16 6.68629 13.3137 4 10 4C6.68629 4 4 6.68629 4 10C4 13.3137 6.68629 16 10 16C13.3137 16 16 13.3137 16 10ZM18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z"
        fill={color}
      />
      <Path
        d="M14.293 14.293C14.6835 13.9024 15.3165 13.9024 15.707 14.293L21.707 20.293C22.0976 20.6835 22.0976 21.3165 21.707 21.707C21.3165 22.0976 20.6835 22.0976 20.293 21.707L14.293 15.707C13.9024 15.3165 13.9024 14.6835 14.293 14.293Z"
        fill={color}
      />
    </Svg>
  );
}
