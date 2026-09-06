import { StyleSheet, View } from 'react-native';

import type { HandoffTypeDto } from '@/features/handoffs/api/handoff.schema';
import { HandoffTypeIcon } from '@/features/handoffs/components/HandoffTypeIcon';
import { Pressable, Text } from '@/shared/ui';
import { radius, spacing, useTheme } from '@/theme';

type HandoffTypeOptionProps = {
  description: string;
  label: string;
  selected: boolean;
  type: HandoffTypeDto;
  onSelect: (type: HandoffTypeDto) => void;
};

export function HandoffTypeOption({
  description,
  label,
  selected,
  type,
  onSelect,
}: HandoffTypeOptionProps) {
  const theme = useTheme();
  const handlePress = () => onSelect(type);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${label}, ${description}`}
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.root,
        {
          backgroundColor: theme.colors.background,
          borderColor: selected ? theme.colors.borderStrong : theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <HandoffTypeIcon type={type} size="large" />
      <View style={styles.copy}>
        <Text weight="semibold">{label}</Text>
        <Text variant="bodySmall" color="textSecondary">
          {description}
        </Text>
      </View>
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? theme.colors.navigationForeground : theme.colors.borderStrong,
          },
        ]}
      >
        {selected && (
          <View style={[styles.radioDot, { backgroundColor: theme.colors.navigationForeground }]} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 82,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    // TODO(design-system): Figma의 82px 최소 높이와 12px 여백을 컴포넌트 토큰으로 동기화한다.
  },
  pressed: { opacity: 0.72 },
  copy: { flex: 1, gap: 2 },
  radio: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 12, height: 12, borderRadius: 999 },
});
