import { Platform, type TextStyle } from 'react-native';

export const fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

/**
 * ⚠️ 디자인 시스템 확정 전 임시값입니다.
 *
 * 타입 스케일(단계 수, 이름, 크기)은 전적으로 디자인 결정 사항이다.
 * 지금은 현재 화면이 쓰는 최소 4단만 두고, 확정되면 통째로 교체한다.
 * 고정 height 없이 fontSize/lineHeight만 정의해 폰트 스케일 대응을 유지한다.
 */
export const typography = {
  title: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  code: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
  },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof typography;
