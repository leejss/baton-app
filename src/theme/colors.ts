import { palette } from '@/theme/tokens';

/**
 * 시맨틱 컬러. 컴포넌트는 `palette`를 직접 import 하지 않고 여기만 참조한다.
 *
 * `static*`은 이름 그대로 테마와 무관하게 고정된 값이다. 다크모드에서도 뒤집히면 안 되는
 * 곳(카카오 버튼 위 라벨 등)에만 쓴다. Figma의 `Semantic/Static/White`와 같은 개념.
 *
 * ⚠️ 다크모드 값은 아직 시안이 없다. 아래 `darkColors`는 라이트 시안에서 역산한 임시값이며,
 * 다크 시안이 나오면 통째로 교체한다.
 */
const light = {
  background: palette.white,
  surface: palette.g200,

  /** 제목·강조 텍스트, primary 버튼 배경. */
  textPrimary: palette.g800,
  /** 본문·입력 라벨. */
  textSecondary: palette.g600,
  /** placeholder, 비활성 라벨, 보조 안내. */
  textTertiary: palette.g400,

  /** 입력 필드 기본 테두리. */
  border: palette.g200,
  /** 구분선, 값이 입력된 입력 필드, 외곽선 버튼. */
  borderStrong: palette.g300,
  /** 포커스된 입력 필드. 시안에서 유일하게 g950이 쓰이는 자리다. */
  borderFocus: palette.g950,
  /** 비활성 입력 필드 테두리. 배경(`surfaceDisabled`)보다 더 옅다. */
  borderSubtle: palette.g100,

  /** 비활성 버튼·입력 배경. `border`와 값은 같지만 의미가 달라 키를 나눈다. */
  surfaceDisabled: palette.g200,

  /** 아직 아이콘·일러스트가 안 나온 자리를 채우는 회색. */
  placeholder: palette.illustrationPlaceholder,

  /** 에러 문구·타이머. 테두리는 한 단계 밝은 `dangerBorder`를 쓴다. */
  danger: palette.red600,
  dangerBorder: palette.red500,
  /** 에러 스낵바 배경. */
  dangerSurface: palette.red50,
  /** 성공은 문구와 테두리가 같은 색이다. */
  success: palette.green500,

  /** 활성 CTA 버튼 배경. 시안의 `Action Button_square` 활성 상태. */
  accent: palette.blue600,
  /** 본문 안의 링크 텍스트("재전송", "이메일 다시 입력하기"). */
  link: palette.blue700,
  /** 스플래시 배경. */
  brand: palette.blue700,

  staticWhite: palette.white,
  staticBlack: palette.black,
} as const;

/** 값은 문자열로 넓힌다 — light/dark가 같은 키 집합만 공유하면 된다. */
export type ThemeColors = Record<keyof typeof light, string>;
export type ThemeColorName = keyof ThemeColors;

export const lightColors: ThemeColors = light;

export const darkColors: ThemeColors = {
  background: palette.black,
  surface: palette.g800,

  textPrimary: palette.white,
  textSecondary: palette.g300,
  textTertiary: palette.g400,

  border: palette.g800,
  borderStrong: palette.g600,
  borderFocus: palette.white,
  borderSubtle: palette.g950,

  surfaceDisabled: palette.g800,

  placeholder: palette.g800,

  danger: palette.red500,
  dangerBorder: palette.red500,
  dangerSurface: palette.g800,
  success: palette.green500,

  accent: palette.blue600,
  link: palette.blue600,
  brand: palette.blue700,

  staticWhite: palette.white,
  staticBlack: palette.black,
};
