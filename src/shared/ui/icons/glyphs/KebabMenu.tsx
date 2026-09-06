import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/kebab menu` (291:4440).
 */
export function KebabMenu(props: IconProps) {
  const { svgProps, color } = useIcon(props, '0 0 2.5 11.5');

  return (
    <Svg {...svgProps}>
      <Path
        d="M0 1.25C0 1.94036 0.559644 2.5 1.25 2.5C1.94036 2.5 2.5 1.94036 2.5 1.25C2.5 0.559644 1.94036 0 1.25 0C0.559644 0 0 0.559644 0 1.25Z"
        fill={color}
      />
      <Path
        d="M0 5.75C0 6.44036 0.559644 7 1.25 7C1.94036 7 2.5 6.44036 2.5 5.75C2.5 5.05964 1.94036 4.5 1.25 4.5C0.559644 4.5 0 5.05964 0 5.75Z"
        fill={color}
      />
      <Path
        d="M0 10.25C0 10.9404 0.559644 11.5 1.25 11.5C1.94036 11.5 2.5 10.9404 2.5 10.25C2.5 9.55964 1.94036 9 1.25 9C0.559644 9 0 9.55964 0 10.25Z"
        fill={color}
      />
    </Svg>
  );
}
