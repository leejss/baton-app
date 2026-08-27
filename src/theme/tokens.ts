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
  /** 버튼·인풋. "시작(로그인 선택)" 시안의 버튼 radius가 8이다. */
  sm: 8,
  md: 12,
  lg: 20,
} as const;

/**
 * 브랜드 그레이 스케일. Figma의 `B` 필 스타일과 1:1 대응한다.
 * (Baton_디자인 작업 → 와이어프레임 1차 → 로그인)
 */
export const brand = {
  b01: '#E5E5E5',
  b02: '#D4D5D9',
  b03: '#989898',
  b04: '#6D6D6D',
} as const;

/**
 * 외부 서비스의 고정 브랜드 색. 우리 테마가 아니므로 다크모드에서도 바뀌지 않고,
 * 시맨틱 컬러로 승격시키지도 않는다. 각 사의 브랜드 가이드가 정한 값이다.
 */
export const socialBrand = {
  kakaoYellow: '#FEE500',
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
   * 스플래시(앱 실행) 배경. `app.config.ts`가 이 값을 직접 import 해서 쓰므로
   * 네이티브 스플래시와 JS 오버레이가 갈라질 일이 없다. 스플래시 외에는 쓰지 않는다.
   */
  splashBackground: brand.b04,
} as const;

export const MAX_CONTENT_WIDTH = 800;

/**
 * 화면 좌우 기본 여백. 시안 주석("양옆 18px")과 버튼 폭(357 = 393 - 18 × 2)에서 온 값이다.
 * `spacing` 스케일(4의 배수)에 없는 값이라 별도 상수로 둔다 — 디자인이 2px 그리드를 쓴다.
 */
export const SCREEN_PADDING_X = 18;
