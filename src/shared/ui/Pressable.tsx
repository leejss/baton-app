import { Pressable as RNPressable, type PressableProps as RNPressableProps } from 'react-native';

export type PressableProps = RNPressableProps;

/**
 * 터치 피드백과 접근성 속성의 단일 진입점.
 * 기능 코드는 RN Pressable 대신 이 래퍼를 사용한다.
 */
export function Pressable(props: PressableProps) {
  return <RNPressable {...props} />;
}
