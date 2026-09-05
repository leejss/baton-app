import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { spacing, type ThemeColorName } from '@/theme';

/**
 * 본문 안의 텍스트 버튼. 시안에서 두 가지로 쓰인다:
 *   link(파랑)        "재전송", "이메일 다시 입력하기"
 *   textTertiary(회색) "로그인 화면으로 돌아가기"
 */
export type TextLinkProps = {
  label: string;
  onPress: () => void;
  color?: Extract<ThemeColorName, 'link' | 'textTertiary'>;
};

export function TextLink({ label, onPress, color = 'link' }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      // 텍스트 높이가 20이라 최소 터치 영역 44에 못 미친다. hitSlop으로 채운다.
      hitSlop={spacing.md}
      style={styles.container}
    >
      <Text variant="caption" color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center' },
});
