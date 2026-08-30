import { palette } from '@/theme/tokens';

/**
 * 시맨틱 컬러. 컴포넌트가 참조하는 유일한 컬러 레이어다.
 * `palette`(원시 토큰)를 컴포넌트에서 직접 import 하지 않는다.
 *
 * ## 이름 규칙
 * 의미색(accent/danger/success/warning)은 넷씩 짝을 이룬다.
 *
 * | 키 | 용도 |
 * |---|---|
 * | `accent` | 꽉 찬 배경(버튼·뱃지 fill) |
 * | `accentOn` | 그 배경 위에 올라가는 전경(텍스트·아이콘) |
 * | `accentSubtle` | 옅은 톤 배경(인라인 알림·칩) |
 * | `accentText` | background/surface/subtle 위에 직접 올리는 텍스트·아이콘 |
 *
 * ## 대비비
 * 아래 조합은 전부 WCAG AA(4.5:1)를 실측으로 통과시킨 값이다. 최저치는
 * `successText`/`successSubtle` = 4.79. 색을 바꾸면 반드시 다시 측정할 것.
 *
 * 예외 둘:
 * - `textDisabled`는 비활성 텍스트라 WCAG 대비 요건에서 제외된다.
 * - `border`는 장식용 구분선이다. 입력 필드 테두리처럼 **의미를 전달하는**
 *   경계는 3:1을 넘는 `borderStrong`을 쓴다.
 */
const light = {
  /** 화면 바닥. */
  background: palette.white,
  /** 배경 위에 한 단 올라온 면(카드·시트). */
  surface: palette.gray50,
  /** surface보다 한 단 더 눌린 면(입력 필드 바닥, 코드 칩). */
  surfaceSunken: palette.gray100,

  textPrimary: palette.gray900,
  textSecondary: palette.gray600,
  textTertiary: palette.gray500,
  textDisabled: palette.gray400,
  /** 어두운 면 위에 올라가는 텍스트. */
  textInverse: palette.white,

  border: palette.gray200,
  borderStrong: palette.gray500,

  accent: palette.blue600,
  accentOn: palette.white,
  accentSubtle: palette.blue50,
  accentText: palette.blue700,

  danger: palette.red600,
  dangerOn: palette.white,
  dangerSubtle: palette.red50,
  dangerText: palette.red700,

  /** green600은 흰 글자와 3.30:1이라 fill로 못 쓴다. 그래서 700이 solid다. */
  success: palette.green700,
  successOn: palette.white,
  successSubtle: palette.green50,
  successText: palette.green700,

  /** 노랑 계열은 흰 글자가 어떤 단계에서도 통과하지 못한다. 전경은 항상 어두운 쪽. */
  warning: palette.yellow400,
  warningOn: palette.gray900,
  warningSubtle: palette.yellow50,
  warningText: palette.yellow700,

  /** 모달·바텀시트 뒤에 까는 막. Figma 명세 없음 — 필요해서 파생한 값이다. */
  overlay: 'rgba(0, 0, 0, 0.48)',
} as const;

/** 값은 문자열로 넓힌다 — light/dark가 같은 키 집합만 공유하면 된다. */
export type ThemeColors = Record<keyof typeof light, string>;
export type ThemeColorName = keyof ThemeColors;

export const lightColors: ThemeColors = light;

export const darkColors: ThemeColors = {
  background: palette.gray950,
  surface: palette.gray900,
  surfaceSunken: palette.gray800,

  textPrimary: palette.gray50,
  textSecondary: palette.gray300,
  textTertiary: palette.gray400,
  textDisabled: palette.gray600,
  textInverse: palette.gray900,

  border: palette.gray800,
  borderStrong: palette.gray500,

  /** solid는 light와 같은 단계를 쓴다 — 어두운 배경에서도 흰 전경이 5.17:1로 통과한다. */
  accent: palette.blue600,
  accentOn: palette.white,
  accentSubtle: palette.blue950,
  accentText: palette.blue400,

  danger: palette.red600,
  dangerOn: palette.white,
  dangerSubtle: palette.red950,
  dangerText: palette.red400,

  success: palette.green700,
  successOn: palette.white,
  successSubtle: palette.green950,
  successText: palette.green400,

  warning: palette.yellow400,
  warningOn: palette.gray900,
  warningSubtle: palette.yellow950,
  warningText: palette.yellow400,

  overlay: 'rgba(0, 0, 0, 0.64)',
};
