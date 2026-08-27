import { brand, palette } from '@/theme/tokens';

/**
 * 시맨틱 컬러. 컴포넌트는 `palette`/`brand`를 직접 import 하지 않고 여기만 참조한다.
 *
 * `static*`은 이름 그대로 테마와 무관하게 고정된 값이다. 다크모드에서도 뒤집히면 안 되는
 * 곳(Apple 버튼의 검정 배경과 흰 라벨 등)에만 쓴다. Figma의 `Semantic/Static/White`와 같은 개념.
 *
 * ⚠️ 다크모드 값은 아직 시안이 없다. 아래 `darkColors`는 라이트 시안에서 역산한 임시값이며,
 * 다크 시안이 나오면 통째로 교체한다.
 */
const light = {
  background: palette.white,
  surface: palette.gray50,
  textPrimary: palette.black,
  textSecondary: brand.b04,
  border: brand.b01,
  /** 아직 아이콘·일러스트가 안 나온 자리를 채우는 회색. 시안의 회색 원이 이 값이다. */
  placeholder: brand.b02,
  staticWhite: palette.white,
  staticBlack: palette.black,
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
  placeholder: palette.gray800,
  staticWhite: palette.white,
  staticBlack: palette.black,
};
