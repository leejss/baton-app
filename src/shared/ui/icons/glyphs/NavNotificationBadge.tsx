import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Navigation Icon/notification` (92:2333).
 */
export function NavNotificationBadge(props: IconProps) {
  const { svgProps, color } = useIcon(props, '0 0 17 21.5');

  return (
    <Svg {...svgProps}>
      <Path
        d="M14.5 8C14.5 4.68629 11.8137 2 8.5 2C5.18629 2 2.5 4.68629 2.5 8V16H14.5V8ZM16.5 16.6667L16.9 17.2C17.0657 17.4209 17.0209 17.7343 16.8 17.9C16.7135 17.9649 16.6082 18 16.5 18H0.5C0.22386 18 0 17.7761 0 17.5C0 17.3918 0.0350899 17.2865 0.0999999 17.2L0.5 16.6667V8C0.5 3.58172 4.08172 0 8.5 0C12.9183 0 16.5 3.58172 16.5 8V16.6667ZM6 19H11C11 20.3807 9.8807 21.5 8.5 21.5C7.1193 21.5 6 20.3807 6 19Z"
        fill={color}
      />
    </Svg>
  );
}
