import { StyleSheet, View } from 'react-native';

import type { HandoffTypeDto } from '@/features/handoffs/api/handoff.schema';
import { HANDOFF_TYPE_ILLUST_ICONS } from '@/features/handoffs/lib/handoffTypeIllustIcons';
import { IllustIcon, Pressable, Text } from '@/shared/ui';
import { SCREEN_PADDING_X, radius, useTheme } from '@/theme';

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
          backgroundColor: theme.colors.backgroundDefault,
          borderColor: selected ? theme.colors.borderPressed : theme.colors.borderDefault,
          borderWidth: selected ? 1.3 : 1,
        },
        pressed && styles.pressed,
      ]}
    >
      <IllustIcon name={HANDOFF_TYPE_ILLUST_ICONS[type]} size={26} />
      <View style={styles.copy}>
        <Text weight="semibold" color="foregroundStrong">
          {label}
        </Text>
        <Text variant="bodySmall" weight="medium" color="foregroundSubtle">
          {description}
        </Text>
      </View>
      <View
        style={[
          styles.radio,
          {
            backgroundColor: selected
              ? theme.colors.surfaceNeutralStrong
              : theme.colors.backgroundDefault,
            borderColor: selected ? theme.colors.borderPressed : theme.colors.borderDefault,
          },
        ]}
      >
        {selected && (
          <View style={[styles.radioDot, { backgroundColor: theme.colors.staticWhite }]} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 82,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  pressed: { opacity: 0.72 },
  copy: { flex: 1, gap: 2 },
  radio: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 6, height: 6, borderRadius: radius.full },
});
