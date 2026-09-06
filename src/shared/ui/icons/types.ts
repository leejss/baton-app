import type { StyleProp, ViewStyle } from 'react-native';

import type { ThemeColorName } from '@/theme';

/**
 * 모든 아이콘 글리프가 공유하는 props. 글리프는 이 타입만 받는다 —
 * `fill`, `stroke`, 원시 색상 문자열을 외부로 열지 않는다.
 *
 * 색을 `ThemeColorName`으로 제한하는 게 이 타입의 핵심이다. 호출부에서
 * `<Icon color="#111827" />`를 못 쓰게 막아야 다크모드가 안 깨진다.
 */
export type IconProps = {
  /**
   * 픽셀 단위 한 변 길이. 아이콘은 항상 정사각형이다.
   *
   * TODO: 명명된 스케일(`iconSize`)을 `theme/tokens.ts`에 아직 올리지 못했다.
   * Figma에 사이즈 변형이 세 벌 있는데 이름과 값이 서로 어긋나기 때문이다:
   *
   * - `Blank Icon_Fill` (18:3261)  — l bg=26, bg=24, md=20, sm=18, x sm=16
   * - `Blank Icon_Stroke` (18:3462) — bg=24, md=20, sm=16
   * - `SNS/apple`·`SNS/kakao`      — sm=16, md=24, lg=32
   *
   * `sm`이 18과 16 두 값을 가리키고, `bg`/`x sm`과 `lg` 체계가 섞여 있다.
   * 디자이너가 한 벌로 정리해 주면 이 prop을 `size?: IconSizeName`으로 좁히고
   * 숫자 입력을 닫는다. 그때까지는 기본값(24)을 벗어나는 값을 새로 만들지 않는다.
   */
  size?: number;
  /** 시맨틱 컬러 키. 원시 팔레트나 리터럴은 받지 않는다. */
  color?: ThemeColorName;
  /**
   * 아이콘 **자체가 의미를 전달할 때만** 준다 (아이콘 단독 버튼 등).
   * 옆에 같은 뜻의 텍스트가 있는 장식용 아이콘은 생략한다 —
   * 생략하면 스크린리더에서 자동으로 숨겨져 중복 낭독을 막는다.
   */
  label?: string;
  style?: StyleProp<ViewStyle>;
};
