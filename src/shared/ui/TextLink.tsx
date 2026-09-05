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
  /** 재발송 쿨다운처럼 잠시 못 누르는 상태. 색이 죽고 탭이 막힌다. */
  disabled?: boolean;
};

export function TextLink({ label, onPress, color = 'link', disabled = false }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      // 텍스트 높이가 20이라 최소 터치 영역 44에 못 미친다. hitSlop으로 채운다.
      hitSlop={spacing.md}
      style={[styles.container, disabled && styles.disabled]}
    >
      <Text variant="caption" color={disabled ? 'textTertiary' : color}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center' },
  disabled: { opacity: 0.6 },
});
