import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useIcon } from '@/shared/ui/icons/useIcon';

/**
 * Figma `Icon/obra/edit-fill` (633:24638).
 */
export function EditFill(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path
        d="M17.8457 10.9978L9.10645 19.7381C8.93865 19.9058 8.71092 19.9998 8.47363 19.9998H4.89453C4.40048 19.9997 4 19.5993 4 19.1053V15.5262C4.00004 15.2889 4.09397 15.0611 4.26172 14.8933L12.6289 6.52615L17.8457 10.9978ZM15.8936 3.26248C16.243 2.91306 16.8098 2.91306 17.1592 3.26248L20.7383 6.8406C21.0876 7.18994 21.0875 7.75679 20.7383 8.10623L18.9092 9.93435L13.6924 5.46267L15.8936 3.26248Z"
        fill={color}
      />
    </Svg>
  );
}
