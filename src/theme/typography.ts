import { Platform, type TextStyle } from 'react-native';

/**
 * Pretendard는 굵기마다 별도 파일이라 `fontWeight`가 아니라 `fontFamily`로 고른다.
 * 이름은 각 .otf의 PostScript 이름과 같고, 파일명과도 같아서 iOS(PostScript 이름 참조)와
 * Android(파일명 참조) 양쪽에서 이 문자열 하나로 동작한다.
 *
 * ⚠️ `fontWeight`를 같이 주면 안 된다. 이미 굵은 파일에 OS가 합성 볼드를 덧씌워 뭉개진다.
 *
 * 폰트 실물은 `app.config.ts`의 expo-font 플러그인이 네이티브에 심는다.
 * 파일을 추가·삭제하면 `expo prebuild` + 재빌드가 필요하다.
 */
export const fonts = {
  medium: 'Pretendard-Medium',
  semiBold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  /** 코드·식별자용. 번들 용량을 위해 별도 폰트를 넣지 않고 시스템 고정폭을 쓴다. */
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
} as const;

/**
 * 타입 스케일. 크기·행간·자간은 Figma 시안에서 실측한 값이다.
 *
 * ⚠️ 시안의 Typography 섹션(Heading 1 / Title 1 / Body 1 …)과 실제 화면이 쓰는 값이
 * 어긋나 있다. 여기 있는 건 **화면에서 실제로 쓰인 값**이다. 디자인 쪽에서 스케일이
 * 정리되면 이름과 단계를 그에 맞춰 다시 맞춘다.
 */
export const typography = {
  /** 화면 제목. 시안 "제목" 노드: Bold 24/32, 자간 -0.55. */
  title: { fontSize: 24, lineHeight: 32, letterSpacing: -0.55, fontFamily: fonts.bold },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fonts.medium },
  caption: { fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },

  /** 아래 4단은 "시작(로그인 선택)" 시안에서 실측한 값이다. */
  tagline: { fontSize: 16, lineHeight: 24, letterSpacing: -0.18, fontFamily: fonts.medium },
  button: { fontSize: 16, lineHeight: 19, letterSpacing: -0.32, fontFamily: fonts.medium },
  footnote: { fontSize: 14, lineHeight: 17, fontFamily: fonts.medium },
  footnoteStrong: { fontSize: 14, lineHeight: 17, fontFamily: fonts.semiBold },

  code: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
  },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof typography;
