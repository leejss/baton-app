import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/obra/check` (493:13945).
 */
export function Check(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M18.1484 7.22754C18.5752 6.75724 19.3021 6.72177 19.7725 7.14844C20.2428 7.57519 20.2782 8.30211 19.8516 8.77246L11.6846 17.7725C11.4645 18.015 11.1517 18.153 10.8242 18.1504C10.4967 18.1478 10.186 18.0048 9.96973 17.7588L5.13574 12.2588C4.71686 11.7817 4.76426 11.0549 5.24121 10.6357C5.7183 10.2169 6.44512 10.2643 6.86426 10.7412L10.8467 15.2734L18.1484 7.22754Z"
        fill={color}
      />
    </Svg>
  );
}
