import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/obra/filter-fill` (530:14620).
 */
export function FilterFill(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M21.6254 4.64194C22.1703 3.99103 21.7075 3 20.8586 3H3.1414C2.2925 3 1.8297 3.99103 2.37464 4.64194L9.8 13.5111V20.1625C9.8 20.5398 10.0124 20.885 10.3492 21.0551L12.7492 22.2673C13.4143 22.6032 14.2 22.1198 14.2 21.3746V13.5111L21.6254 4.64194Z"
        fill={color}
      />
    </Svg>
  );
}
