import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * cancel, close, delete, remove, times, clear, math, multiply, multiplication
 *
 * Figma `Icon/tabler/x` (78:1712).
 */
export function X(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M5.34649 18.6557C5.81447 19.1147 6.61543 19.1057 7.04741 18.6647L11.9972 13.715L16.938 18.6647C17.3969 19.1147 18.1799 19.1147 18.6479 18.6467C19.1069 18.1787 19.1159 17.3958 18.6569 16.9458L13.7161 11.996L18.6569 7.05527C19.1159 6.60529 19.1159 5.81333 18.6479 5.35435C18.1709 4.88637 17.3969 4.88637 16.938 5.33635L11.9972 10.2771L7.04741 5.33635C6.61543 4.89537 5.80547 4.87737 5.34649 5.34535C4.87851 5.81333 4.89651 6.61429 5.32849 7.05527L10.2783 11.996L5.32849 16.9458C4.89651 17.3868 4.87851 18.1877 5.34649 18.6557Z"
        fill={color}
      />
    </Svg>
  );
}
