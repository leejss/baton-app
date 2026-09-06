import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';

import * as icons from '@/shared/ui/icons';
import type { IconProps } from '@/shared/ui/icons/types';
import { lightColors } from '@/theme/colors';

type Glyph = (props: IconProps) => React.JSX.Element;

/** 배럴에서 글리프 컴포넌트만 추린다 (훅·상수·타입 제외). */
const glyphs = Object.entries(icons).filter(
  (entry): entry is [string, Glyph] => typeof entry[1] === 'function' && /^[A-Z]/.test(entry[0]),
);

/**
 * react-native-svg는 `fill="#2563EB"`를 `{ type: 0, payload: 0xFF2563EB }`로
 * 정규화해서 네이티브에 넘긴다. 비교하려면 같은 형태로 만들어야 한다.
 */
function argb(hex: string) {
  return (0xff000000 | Number.parseInt(hex.slice(1), 16)) >>> 0;
}

/**
 * 실제 도형(Path/Circle/...)에 칠해진 색만 모은다.
 * `RNSVGGroup`은 상속용 기본값(검정)을 항상 들고 있어 제외한다.
 */
function shapeFills(node: unknown, found: number[] = []): number[] {
  if (Array.isArray(node)) {
    for (const n of node) shapeFills(n, found);
    return found;
  }
  if (node === null || typeof node !== 'object') return found;
  const el = node as { type?: string; props?: Record<string, unknown>; children?: unknown };
  const isShape =
    typeof el.type === 'string' &&
    el.type.startsWith('RNSVG') &&
    el.type !== 'RNSVGGroup' &&
    el.type !== 'RNSVGSvgView' &&
    el.type !== 'RNSVGDefs';
  const fill = el.props?.fill as { payload?: number } | undefined;
  if (isShape && fill && typeof fill.payload === 'number') found.push(fill.payload);
  shapeFills(el.children, found);
  return found;
}

describe('글리프', () => {
  it('배럴이 글리프를 노출한다', () => {
    expect(glyphs.length).toBeGreaterThan(70);
  });

  it.each(glyphs)('%s: 크래시 없이 렌더된다', async (_name, Glyph) => {
    const view = await render(<Glyph />);

    expect(view.toJSON()).not.toBeNull();
  });

  it.each(glyphs)('%s: 도형이 color prop 색으로만 칠해진다', async (_name, Glyph) => {
    const view = await render(<Glyph color="accent" />);
    const fills = shapeFills(view.toJSON());

    expect(fills.length).toBeGreaterThan(0);
    /** Figma 원본 색(#1F2937 등)이 하드코딩으로 남아 있으면 여기서 걸린다. */
    expect([...new Set(fills)]).toEqual([argb(lightColors.accent)]);
  });
});
