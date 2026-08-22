import { palette } from '@/theme/tokens';

/**
 * ⚠️ 디자인 시스템 확정 전 임시값입니다. `tokens.ts` 주석 참고.
 *
 * 지금은 화면을 그리는 데 꼭 필요한 최소 키만 둔다.
 * accent·danger·success 같은 의미색은 디자인이 정해진 뒤 추가한다 —
 * 미리 만들면 대비비(4.5:1)를 추측으로 맞추게 되고, 결국 다시 고친다.
 */
const light = {
  background: palette.white,
  surface: palette.gray50,
  textPrimary: palette.black,
  textSecondary: palette.gray600,
  border: palette.gray100,
} as const;

/** 값은 문자열로 넓힌다 — light/dark가 같은 키 집합만 공유하면 된다. */
export type ThemeColors = Record<keyof typeof light, string>;
export type ThemeColorName = keyof ThemeColors;

export const lightColors: ThemeColors = light;

export const darkColors: ThemeColors = {
  background: palette.black,
  surface: palette.gray900,
  textPrimary: palette.white,
  textSecondary: palette.gray400,
  border: palette.gray800,
};
