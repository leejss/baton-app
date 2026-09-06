import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/arrow-left-s-line` (90:1551).
 */
export function ArrowLeftS(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M10.8284 12.0007L15.0711 16.2433C15.4616 16.6338 15.4616 17.267 15.0711 17.6575C14.6806 18.048 14.0474 18.048 13.6569 17.6575L8.70712 12.7078C8.31659 12.3173 8.31659 11.6841 8.70711 11.2936L13.6569 6.34382C14.0474 5.9533 14.6806 5.9533 15.0711 6.34383C15.4616 6.73435 15.4616 7.36751 15.0711 7.75803L10.8284 12.0007Z"
        fill={color}
      />
    </Svg>
  );
}
