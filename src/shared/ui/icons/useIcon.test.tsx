import { describe, expect, it } from '@jest/globals';
import { render, renderHook, screen } from '@testing-library/react-native';
import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/shared/ui/icons/types';
import { DEFAULT_ICON_SIZE, useIcon } from '@/shared/ui/icons/useIcon';
import { lightColors } from '@/theme/colors';

/**
 * 실제 Figma 글리프가 아니라 `useIcon` 계약을 검증하기 위한 표본이다.
 * 진짜 글리프는 `glyphs/`에 들어간다 — 여기 있는 path는 디자인 값이 아니다.
 */
function SampleIcon(props: IconProps) {
  const { svgProps, color } = useIcon(props);

  return (
    <Svg {...svgProps}>
      <Path d="M0 0h24v24H0z" fill={color} />
    </Svg>
  );
}

/** 렌더 트리 루트(= Svg)에 실제로 도달한 props를 읽는다. */
function rootProps() {
  const tree = screen.toJSON();
  if (tree === null || Array.isArray(tree)) {
    throw new Error('단일 루트 노드를 기대했다');
  }
  return tree.props as Record<string, unknown>;
}

describe('useIcon', () => {
  it('크기를 지정하지 않으면 기본 크기로 정사각형을 그린다', async () => {
    await render(<SampleIcon />);

    expect(rootProps()).toMatchObject({
      width: DEFAULT_ICON_SIZE,
      height: DEFAULT_ICON_SIZE,
    });
  });

  it('size를 주면 가로세로에 함께 반영한다', async () => {
    await render(<SampleIcon size={16} />);

    expect(rootProps()).toMatchObject({ width: 16, height: 16 });
  });

  it('color 키를 시맨틱 컬러 값으로 풀어 글리프에 넘긴다', async () => {
    const { result } = await renderHook(() => useIcon({ color: 'danger' }));

    expect(result.current.color).toBe(lightColors.danger);
  });

  it('color를 생략하면 textPrimary로 그린다', async () => {
    const { result } = await renderHook(() => useIcon({}));

    expect(result.current.color).toBe(lightColors.textPrimary);
  });

  it('label을 주면 스크린리더가 이미지로 읽는다', async () => {
    await render(<SampleIcon label="닫기" />);

    expect(screen.getByLabelText('닫기')).toBeTruthy();
    expect(rootProps()).toMatchObject({
      accessible: true,
      accessibilityRole: 'image',
    });
  });

  it('label이 없으면 장식용으로 보고 접근성 트리에서 숨긴다', async () => {
    await render(<SampleIcon />);

    expect(rootProps()).toMatchObject({
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    });
  });
});
