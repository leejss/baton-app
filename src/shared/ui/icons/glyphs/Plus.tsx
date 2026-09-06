import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/plus` (150:2453).
 */
export function Plus(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M12 3.75C12.6904 3.75 13.25 4.30964 13.25 5V10.75H19C19.6904 10.75 20.25 11.3096 20.25 12C20.25 12.6904 19.6904 13.25 19 13.25H13.25V19C13.25 19.6904 12.6904 20.25 12 20.25C11.3096 20.25 10.75 19.6904 10.75 19V13.25H5C4.30964 13.25 3.75 12.6904 3.75 12C3.75 11.3096 4.30964 10.75 5 10.75H10.75V5C10.75 4.30964 11.3096 3.75 12 3.75Z"
        fill={color}
      />
    </Svg>
  );
}
