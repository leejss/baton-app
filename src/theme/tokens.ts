/**
 * 원시 토큰. Figma "최종 디자인 시스템" 파일의 로그인 플로우 시안(393×852)에서 실측한 값이다.
 *
 * 컴포넌트는 이 파일을 직접 import 하지 않는다. 항상 `useTheme().colors`(시맨틱)를 거친다.
 * 예외는 스플래시뿐인데, 네이티브 스플래시(`app.config.ts`)와 값을 공유해야 해서 그렇다.
 */

/** 4px 배수 스케일. 디자인 무관한 산술이라 그대로 가져간다. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  /** 버튼. 시안의 `Action Button_square`가 8이다. */
  sm: 8,
  /** 입력 필드. 시안의 `input`이 12다. */
  md: 12,
  lg: 20,
  full: 9999,
} as const;

/**
 * 그레이 스케일. 시안이 Tailwind 기본 그레이를 그대로 쓰고 있어 이름도 그에 맞췄다.
 * (이전 `brand.b01~b04`는 와이어프레임 1차 값이라 폐기했다.)
 */
export const gray = {
  g100: '#F3F4F6',
  g200: '#E5E7EB',
  g300: '#D1D5DB',
  g400: '#9CA3AF',
  g600: '#4B5563',
  g800: '#1F2937',
  g950: '#030712',
} as const;

/** 입력 필드·스낵바의 Error·Success 색. 테두리와 문구 색이 달라서 단계를 나눠 둔다. */
export const status = {
  red50: '#FEF2F2',
  red500: '#EF4444',
  red600: '#DC2626',
  green500: '#22C55E',
} as const;

/**
 * 브랜드 블루. 시안이 두 단계를 쓴다 — 활성 CTA 버튼은 600, 스플래시와 링크는 700이다.
 * 같은 파랑으로 보이지만 실측값이 다르므로 합치지 않는다.
 */
export const brand = {
  blue600: '#2563EB',
  blue700: '#1D4ED8',
} as const;

/**
 * 외부 서비스의 고정 브랜드 색. 우리 테마가 아니므로 다크모드에서도 바뀌지 않고,
 * 시맨틱 컬러로 승격시키지도 않는다. 각 사의 브랜드 가이드가 정한 값이다.
 */
export const socialBrand = {
  kakaoYellow: '#FEE500',
} as const;

export const palette = {
  white: '#FFFFFF',
  black: '#000000',
  ...gray,
  ...brand,
  ...status,

  /** 아직 일러스트가 안 나온 자리를 채우는 회색. 시안의 회색 사각형이 이 값이다. */
  illustrationPlaceholder: '#ECECEC',

  /**
   * 스플래시(앱 실행) 배경. `app.config.ts`가 이 값을 직접 import 해서 쓰므로
   * 네이티브 스플래시와 JS 오버레이가 갈라질 일이 없다. 스플래시 외에는 쓰지 않는다.
   */
  splashBackground: brand.blue700,
} as const;

export const MAX_CONTENT_WIDTH = 800;

/**
 * 화면 좌우 기본 여백. 시안의 버튼 폭(357 = 393 - 18 × 2)에서 온 값이다.
 * `spacing` 스케일(4의 배수)에 없는 값이라 별도 상수로 둔다 — 디자인이 2px 그리드를 쓴다.
 */
export const SCREEN_PADDING_X = 18;
