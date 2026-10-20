import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { spacing, type ThemeColorName } from '@/theme';

type TextLinkProps = {
  label: string;
  onPress: () => void;
  color?: Extract<ThemeColorName, 'foregroundBlueDefault' | 'foregroundSubtle'>;
  disabled?: boolean;
};

export function TextLink({
  label,
  onPress,
  color = 'foregroundBlueDefault',
  disabled = false,
}: TextLinkProps) {
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
      <Text variant="bodySmall" weight="medium" color={disabled ? 'foregroundSubtle' : color}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center' },
  disabled: { opacity: 0.6 },
});
