import { Platform, type TextStyle } from 'react-native';

/**
 * 타입 스케일. 출처: Figma `Baton-Design System` (node 9:44).
 *
 * Figma는 8개 역할 × 3개 굵기(regular/medium/semibold) 그리드로 정의돼 있다.
 * 여기서도 같은 모양을 유지한다 — `typography.body.semibold` 처럼 접근한다.
 *
 * ⚠️ `bold`(700)는 Figma 그리드 밖이다. 로그인 플로우 시안이 화면 제목과 스낵바
 * 액션에서 Bold를 쓰고 있어 굵기 축에만 더해 뒀다. Figma Typography 섹션과 실제
 * 화면 값이 어긋나 있는 상태이며, 디자인 쪽에서 정리되면 이 축을 도로 뺀다.
 * letter-spacing은 전 단계 0이라 따로 두지 않는다.
 *
 * | 역할 | size / line-height |
 * |---|---|
 * | displayLarge | 32 / 42 |
 * | display | 28 / 36 |
 * | heading | 24 / 32 |
 * | subheading | 20 / 28 |
 * | title | 18 / 26 |
 * | body | 16 / 28 |
 * | bodySmall | 14 / 20 |
 * | caption | 12 / 16 |
 *
 * 고정 `height`는 두지 않는다 — 폰트 스케일 대응을 깨지 않기 위해서다.
 */

/**
 * Figma 지정 서체 Pretendard. `app.config.ts`의 `expo-font` 플러그인이 네이티브
 * 번들에 심으므로 런타임 로딩 없이 첫 프레임부터 쓸 수 있다.
 *
 * 이름은 iOS에서 PostScript 이름, Android에서 파일명으로 해석되는데 Pretendard는
 * 둘이 같아서 아래 문자열 하나로 양쪽이 맞는다.
 */
export const fontFamily = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  /** Figma 명세 밖. 값 표시용 고정폭 서체라 플랫폼 기본을 그대로 쓴다. */
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
} as const;

/**
 * 굵기 이름 → CSS 수치. Pretendard는 굵기별로 **파일이 따로**라 실제 렌더는
 * `fontFamily`가 결정한다. 이 값은 mono처럼 단일 파일 서체에만 적용된다.
 *
 * Pretendard 쪽에 `fontWeight`를 같이 주면 안 된다 — 이미 굵기가 박힌 페이스 위에
 * iOS/Android가 합성 볼드를 덧씌워 뭉개진다.
 */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export type FontWeightName = keyof typeof fontWeight;
export type TextFamily = 'sans' | 'mono';

type WeightedStyles = Record<FontWeightName, TextStyle>;

function scale(fontSize: number, lineHeight: number, family: TextFamily = 'sans'): WeightedStyles {
  const face = (weight: FontWeightName): TextStyle =>
    family === 'mono'
      ? { fontFamily: fontFamily.mono, fontWeight: fontWeight[weight] }
      : { fontFamily: fontFamily[weight] };

  return {
    regular: { fontSize, lineHeight, ...face('regular') },
    medium: { fontSize, lineHeight, ...face('medium') },
    semibold: { fontSize, lineHeight, ...face('semibold') },
    bold: { fontSize, lineHeight, ...face('bold') },
  };
}

export const typography = {
  displayLarge: scale(32, 42),
  display: scale(28, 36),
  heading: scale(24, 32),
  subheading: scale(20, 28),
  title: scale(18, 26),
  body: scale(16, 28),
  bodySmall: scale(14, 20),
  caption: scale(12, 16),
  /** Figma 명세 밖. 앱에서 원시 값(버전, ID 등)을 표시할 때만 쓴다. */
  code: scale(12, 16, 'mono'),
} as const satisfies Record<string, WeightedStyles>;

export type TextVariant = keyof typeof typography;
