/**
 * 원시(primitive) 토큰.
 *
 * 출처: Figma `Baton-Design System` / `primitives` 섹션 (node 9:44).
 * 여기 있는 값은 "이름 없는 재료"다. 컴포넌트가 직접 import 하지 않는다 —
 * 반드시 `colors.ts`의 시맨틱 레이어를 거쳐 `useTheme().colors`로만 접근한다.
 *
 * 값을 바꾸려면 Figma가 먼저 바뀌어야 한다. 여기서 임의로 추가하지 않는다.
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
  sm: 6,
  md: 12,
  /** Figma shadow 예시 카드가 쓰는 값. */
  lg: 20,
  full: 999,
} as const;

/**
 * Figma primitives 그리드를 그대로 옮긴 값. 컬럼 = 색상군, 로우 = 50~950.
 * 어떤 팔레트를 닮았든 기준은 Figma다 — 다른 값으로 "고치지" 않는다.
 *
 * 한 가지 예외 처리: Figma에서 blue 950 스와치의 라벨이 "900"으로 잘못 적혀 있다
 * (node 51:487). 같은 컬럼에 900이 둘이 될 수는 없어서 위치 기준으로 950으로 읽었다.
 */
export const palette = {
  white: '#FFFFFF',
  /**
   * Figma primitives에는 없다. shadow/scrim의 rgba 기준색으로만 쓰는 값이라
   * 시맨틱 컬러로 노출하지 않는다.
   */
  black: '#000000',

  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  gray950: '#030712',

  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue300: '#93C5FD',
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue800: '#1E40AF',
  blue900: '#1E3A8A',
  blue950: '#172554',

  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red200: '#FECACA',
  red300: '#FCA5A5',
  red400: '#F87171',
  red500: '#EF4444',
  red600: '#DC2626',
  red700: '#B91C1C',
  red800: '#991B1B',
  red900: '#7F1D1D',
  red950: '#450A0A',

  yellow50: '#FEFCE8',
  yellow100: '#FEF9C3',
  yellow200: '#FEF08A',
  yellow300: '#FDE047',
  yellow400: '#FACC15',
  yellow500: '#EAB308',
  yellow600: '#CA8A04',
  yellow700: '#A16207',
  yellow800: '#854D0E',
  yellow900: '#713F12',
  yellow950: '#422006',

  green50: '#F0FDF4',
  green100: '#DCFCE7',
  green200: '#BBF7D0',
  green300: '#83E7A8',
  green400: '#4ADE80',
  green500: '#22C55E',
  green600: '#16A34A',
  green700: '#15803D',
  green800: '#166534',
  green900: '#14532D',
  green950: '#052E16',

  /**
   * orange는 Figma primitives에 있지만 아직 어떤 의미(semantic)에도 배정되지 않았다.
   * 역할이 정해지기 전까지 `colors.ts`에 올리지 않는다 — 지금 올리면 추측으로
   * 대비비를 맞추게 되고 결국 다시 고친다.
   */
  orange50: '#FFF7ED',
  orange100: '#FFEDD5',
  orange200: '#FED7AA',
  orange300: '#FDBA74',
  orange400: '#FB923C',
  orange500: '#F97316',
  orange600: '#EA580C',
  orange700: '#C2410C',
  orange800: '#9A3412',
  orange900: '#7C2D12',
  orange950: '#431407',

  /**
   * 디자인 시스템 바깥의 값. `app.config.ts`의 스플래시 배경과 반드시 같아야 한다.
   * 스플래시 외에는 쓰지 않는다.
   *
   * 값은 `blue700`과 같다. 객체 리터럴 안에서 자기 참조가 안 돼 리터럴로 둔다 —
   * blue700을 바꾸면 여기와 `app.config.ts`도 같이 바꿔야 한다.
   */
  splashBackground: '#1D4ED8',
} as const;

export type PaletteName = keyof typeof palette;

export const MAX_CONTENT_WIDTH = 800;

/**
 * 외부 서비스의 고정 브랜드 색. 우리 디자인 시스템이 아니므로 Figma primitives에 없고,
 * 다크모드에서도 바뀌지 않으며, 시맨틱 컬러로 승격시키지도 않는다.
 * 각 사의 브랜드 가이드가 정한 값이라 우리가 조정할 수 없다.
 */
export const socialBrand = {
  kakaoYellow: '#FEE500',
} as const;

/**
 * 화면 좌우 기본 여백. 로그인 시안의 버튼 폭(357 = 393 - 18 x 2)에서 온 값이다.
 * `spacing` 스케일(4의 배수)에 없는 값이라 별도 상수로 둔다 - 디자인이 2px 그리드를 쓴다.
 */
export const SCREEN_PADDING_X = 18;
