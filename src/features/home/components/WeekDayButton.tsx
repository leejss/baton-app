import { Pressable, StyleSheet, View } from 'react-native';

import type { HomeWeekDay } from '@/features/home/types';
import { Text } from '@/shared/ui';
import { radius, useTheme } from '@/theme';

type WeekDayButtonProps = {
  day: HomeWeekDay;
  onSelect: (date: string) => void;
};

export function WeekDayButton({ day, onSelect }: WeekDayButtonProps) {
  const theme = useTheme();
  const handlePress = () => onSelect(day.date);

  return (
    <Pressable
      accessibilityLabel={day.accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: day.isSelected }}
      hitSlop={2}
      onPress={handlePress}
      style={({ pressed }) => [styles.touchTarget, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.visual,
          day.isSelected && { backgroundColor: theme.colors.surfaceBlueDefault },
        ]}
      >
        <Text
          variant="body"
          weight="medium"
          color={day.isSelected ? 'foregroundBlueDefault' : 'foregroundDisabled'}
          style={styles.dayText}
        >
          {day.day}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    flex: 1,
    minWidth: 36,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visual: {
    minWidth: 40,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
  },
  pressed: { opacity: 0.65 },
});
