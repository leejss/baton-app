import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/arrow-right-s-line` (90:1554).
 */
export function ArrowRightS(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M13.1717 12.0007L8.92903 7.75804C8.5385 7.36751 8.53851 6.73435 8.92903 6.34382C9.31956 5.9533 9.95272 5.9533 10.3432 6.34383L15.293 11.2936C15.6835 11.6841 15.6835 12.3173 15.293 12.7078L10.3432 17.6575C9.95272 18.048 9.31956 18.048 8.92904 17.6575C8.53851 17.267 8.53851 16.6338 8.92904 16.2433L13.1717 12.0007Z"
        fill={color}
      />
    </Svg>
  );
}
