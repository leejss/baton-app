import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/eyes` (530:14589).
 */
export function EyeOnFill(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M12 5C15.9031 5 19.7362 7.2363 21.8944 11.5527C22.0352 11.8343 22.0352 12.1657 21.8944 12.4473C19.7362 16.7637 15.9031 19 12 19C8.09691 19 4.26377 16.7637 2.10557 12.4473C1.96481 12.1657 1.96481 11.8343 2.10557 11.5527C4.26377 7.2363 8.09691 5 12 5ZM12 8.5C10.067 8.5 8.50004 10.067 8.50004 12C8.50004 13.933 10.067 15.5 12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 10.495C12.8284 10.495 13.5 11.1643 13.5 11.99L13.5 12C13.5 12.8257 12.8284 13.495 12 13.495C11.1716 13.495 10.5 12.8257 10.5 12L10.5 11.99C10.5 11.1643 11.1716 10.495 12 10.495Z"
        fill={color}
      />
    </Svg>
  );
}
