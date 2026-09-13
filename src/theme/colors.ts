import { palette } from '@/theme/tokens';

/**
 * Figma `최종 디자인 시스템`의 semantic 컬러를 앱에서 사용하는 형태로 옮긴 투영본.
 *
 * Figma의 로컬 변수 경로를 slash 없이 camelCase로 표현한다. 같은 색상값을 갖더라도
 * Figma에서 의미가 다른 변수는 별도의 키로 유지한다. 컴포넌트는 이 레이어만 참조한다.
 * 현재 Figma 컬러 컬렉션은 단일 모드만 제공하므로 별도 컬러 세트를 두지 않는다.
 */
const colors = {
  backgroundDefault: palette.white, // background/default
  backgroundSubtle: palette.gray50, // background/subtle

  foregroundStrong: palette.gray800, // foreground/strong
  foregroundDefault: palette.gray600, // foreground/default
  foregroundSubtle: palette.gray400, // foreground/subtle
  foregroundDisabled: palette.gray400, // foreground/disabled
  foregroundInverse: palette.white, // foreground/inverse
  foregroundBlueSoft: palette.blue600, // foreground/blue/soft
  foregroundBlueDefault: palette.blue700, // foreground/blue/default
  foregroundWarningDefault: palette.red600, // foreground/warning/default
  foregroundSuccessDefault: palette.green600, // foreground/success/default
  foregroundCautionaryDefault: palette.yellow600, // foreground/cautionary/default

  surfaceBlueStrong: palette.blue600, // surface/blue/strong
  surfaceBlueDefault: palette.blue50, // surface/blue/default
  surfaceBlueSubtle: palette.blue100, // surface/blue/subtle
  surfaceBluePressed: palette.blue700, // surface/blue/pressed
  surfaceNeutralStrong: palette.gray800, // surface/neutral/strong
  surfaceNeutralDefault: palette.white, // surface/neutral/default
  surfaceNeutralMedium: palette.gray200, // surface/neutral/medium
  surfaceNeutralSubtle: palette.gray100, // surface/neutral/subtle
  surfaceNeutralDisabled: palette.gray200, // surface/neutral/disabled
  surfaceNeutralPressed: palette.gray950, // surface/neutral/pressed
  surfaceWarningDefault: palette.red500, // surface/warning/default
  surfaceWarningSoft: palette.red50, // surface/warning/soft
  surfaceWarningPressed: palette.red600, // surface/warning/pressed
  surfaceSuccessDefault: palette.green500, // surface/success/default
  surfaceSuccessSoft: palette.green50, // surface/success/soft
  surfaceSuccessPressed: palette.green700, // surface/success/pressed
  surfaceCautionaryDefault: palette.yellow500, // surface/cautionary/default
  surfaceCautionarySoft: palette.yellow100, // surface/cautionary/soft

  borderStrong: palette.gray300, // border/strong
  borderDefault: palette.gray300, // border/default
  borderSubtle: palette.gray100, // border/subtle
  borderPressed: palette.gray950, // border/pressed
  borderWarningDefault: palette.red500, // border/warning/default
  borderSuccessDefault: palette.green500, // border/success/default
  overlayDimmed: 'rgba(0, 0, 0, 0.6)', // overlay/dimmed

  tagSurfaceFillNeutral: palette.gray500, // tag/surface/fill/neutral
  // Figma semantic direct value. It is intentionally not a primitive palette value.
  tagSurfaceSoftBlue: '#EFF6FF', // tag/surface/soft/blue
  tagSurfaceSoftOrange: palette.orange50, // tag/surface/soft/orange
  tagForegroundOrange: palette.orange600, // tag/foreground/orange

  /** Figma 바깥의 고정색. 브랜드·시스템 고정 배경 위에서만 사용한다. */
  staticWhite: palette.white,
  staticBlack: palette.black,
} as const;

export type ThemeColors = { [Key in keyof typeof colors]: string };
export type ThemeColorName = keyof ThemeColors;

export const appColors: ThemeColors = colors;
