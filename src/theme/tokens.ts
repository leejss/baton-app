/**
 * ⚠️ 디자인 시스템 확정 전 임시값입니다.
 *
 * 여기 있는 숫자와 색은 "정해진 것"이 아니라 화면이 렌더되게 하려고 둔 자리표시자입니다.
 * 디자인이 나오면 이 파일과 `colors.ts`만 교체하면 되도록, 컴포넌트는
 * 절대 이 값을 직접 import 하지 않고 `useTheme()`을 거칩니다.
 *
 * 새 색·크기가 필요해지면 여기에 추가하기 전에 디자인 확정 여부를 먼저 확인할 것.
 */

/** 4px 배수 스케일. 디자인 무관한 산술이라 그대로 가져가도 무방하다. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
} as const;

/** 중립 그레이만 둔다. 브랜드 팔레트는 디자인 확정 후 채운다. */
export const palette = {
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F0F0F3',
  gray100: '#E0E1E6',
  gray400: '#B0B4BA',
  gray600: '#60646C',
  gray800: '#2E3135',
  gray900: '#212225',

  /**
   * 유일한 예외. `app.config.ts`의 스플래시 배경과 반드시 같아야 하는 값이라
   * 디자인 시스템과 무관하게 이미 정해져 있다. 스플래시 외에는 쓰지 않는다.
   */
  splashBackground: '#208AEF',
} as const;

export const MAX_CONTENT_WIDTH = 800;
