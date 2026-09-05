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
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semiBold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  /** 코드·식별자용. 번들 용량을 위해 별도 폰트를 넣지 않고 시스템 고정폭을 쓴다. */
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
} as const;

/**
 * 타입 스케일. Figma 로그인 플로우 시안(`943:111091`, `943:111106`, `943:111123`)에서 실측했다.
 *
 * ⚠️ 시안의 Typography 섹션(Heading 1 / Title 1 / Body 1 …)과 실제 화면이 쓰는 값이
 * 어긋나 있다. 여기 있는 건 **화면에서 실제로 쓰인 값**이다. 디자인 쪽에서 스케일이
 * 정리되면 이름과 단계를 그에 맞춰 다시 맞춘다.
 */
export const typography = {
  /** 화면 제목. "환영합니다." */
  title: { fontSize: 28, lineHeight: 36, fontFamily: fonts.bold },
  /** 본문·화면 설명. 시작 화면 태그라인도 같은 값이라 `tagline`을 따로 두지 않는다. */
  body: { fontSize: 16, lineHeight: 28, fontFamily: fonts.medium },
  /** 스낵바 제목. `button`과 수치는 같지만 역할이 달라 따로 둔다. */
  bodyStrong: { fontSize: 16, lineHeight: 28, fontFamily: fonts.semiBold },
  /** 입력 필드 라벨. "이메일" / "비밀번호" */
  label: { fontSize: 18, lineHeight: 26, fontFamily: fonts.semiBold },
  /** 입력 필드 안의 값과 placeholder. */
  input: { fontSize: 16, lineHeight: 28, fontFamily: fonts.regular },
  /** 입력 필드 아래 보조 안내·에러. */
  helper: { fontSize: 12, lineHeight: 16, fontFamily: fonts.regular },
  /** 인증 남은시간, 스낵바 설명. `helper`와 크기는 같고 굵기만 다르다. */
  captionSmall: { fontSize: 12, lineHeight: 16, fontFamily: fonts.medium },
  /** 버튼 라벨. */
  button: { fontSize: 16, lineHeight: 28, fontFamily: fonts.semiBold },
  /** "또는", "아직 회원이 아니신가요?" */
  footnote: { fontSize: 14, lineHeight: 17, fontFamily: fonts.medium },
  /** 푸터 안의 강조 링크. "회원가입" */
  footnoteStrong: { fontSize: 14, lineHeight: 17, fontFamily: fonts.semiBold },

  /** 본문 링크·하단 안내("재전송", "로그인 화면으로 돌아가기"). */
  caption: { fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
  /** 스낵바의 액션 텍스트("확인"). */
  captionStrong: { fontSize: 14, lineHeight: 20, fontFamily: fonts.bold },

  code: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
  },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof typography;
