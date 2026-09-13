import type { ViewStyle } from 'react-native';

/**
 * 그림자. 출처: Figma `Baton-Design System` / Shadow (node 21:1513).
 *
 * Figma의 drop shadow 파라미터(offset-y / blur / color)를 CSS box-shadow 문법으로
 * 1:1 옮긴 값이다. spread는 세 단계 모두 0.
 *
 * | 이름 | Figma | 쓰는 곳 |
 * |---|---|---|
 * | `subtle` | y2 · blur4 · 6% | 배경에서 겨우 떠 있는 카드, 리스트 아이템 |
 * | `default` | y4 · blur8 · 8% | 일반 카드, 팝오버 |
 * | `strong` | y6 · blur18 · 24% | 바텀시트, 모달, FAB |
 *
 * RN 0.76+의 `boxShadow`를 쓴다. CSS와 같은 의미라 Figma 값이 그대로 들어가고
 * iOS/Android가 동일하게 렌더된다(New Architecture 필요 — SDK 57 기본값).
 * 레거시 `shadowOffset`/`elevation`과 **섞어 쓰지 않는다.** 안드로이드에서 두 번 그려진다.
 *
 * 그림자 색은 Figma 명세대로 검정 고정이다. 깊이 표현은 컬러 테마 분기와
 * 무관하게 이 토큰을 사용한다.
 */
export const shadows = {
  subtle: { boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.06)' },
  default: { boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.08)' },
  strong: { boxShadow: '0px 6px 18px 0px rgba(0, 0, 0, 0.24)' },
} as const satisfies Record<string, ViewStyle>;

export type ShadowName = keyof typeof shadows;
