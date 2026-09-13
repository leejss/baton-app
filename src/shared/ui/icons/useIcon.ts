import type { SvgProps } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { useTheme } from '@/theme';

/**
 * Figma 아이콘 프레임 확정 전까지 쓰는 단일 기본값. `types.ts`의 TODO 참고.
 * expo-symbols의 기본값과도 같아서 시스템 심볼과 나란히 놓아도 크기가 맞는다.
 */
export const DEFAULT_ICON_SIZE = 24;

/** 아이콘셋 전체가 같은 좌표계를 쓴다. 다른 격자로 그려진 글리프만 개별 지정한다. */
const DEFAULT_VIEW_BOX = '0 0 24 24';

type UseIconResult = {
  /** 글리프의 `fill` / `stroke`에 그대로 바인딩한다. */
  color: string;
  /** `<Svg {...svgProps}>`로 펼친다. */
  svgProps: SvgProps;
};

/**
 * 글리프 파일이 반복해야 할 것(테마 조회, 크기, 접근성 분기)을 한곳에 모은다.
 * 글리프는 path 데이터만 갖고, 나머지 동작은 전부 여기서 결정된다.
 *
 * 라이트모드 고정 테마는 `useTheme()`이 제공하므로 글리프가 개별 색상을 정의하지 않는다.
 */
export function useIcon(
  { size = DEFAULT_ICON_SIZE, color = 'foregroundStrong', label, style }: IconProps,
  viewBox: string = DEFAULT_VIEW_BOX,
): UseIconResult {
  const theme = useTheme();

  /** label이 없으면 장식용으로 보고 접근성 트리에서 통째로 뺀다. */
  const isDecorative = label === undefined;

  return {
    color: theme.colors[color],
    svgProps: {
      width: size,
      height: size,
      viewBox,
      style,
      accessible: !isDecorative,
      accessibilityRole: isDecorative ? undefined : 'image',
      accessibilityLabel: label,
      accessibilityElementsHidden: isDecorative,
      importantForAccessibility: isDecorative ? 'no-hide-descendants' : 'yes',
    },
  };
}
