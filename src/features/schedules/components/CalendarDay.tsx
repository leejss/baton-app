import { StyleSheet, View } from 'react-native';

import { formatKoreanDate } from '@/shared/lib/formatters';
import { Pressable, Text } from '@/shared/ui';
import { radius, useTheme } from '@/theme';

type CalendarDayProps = {
  date: string;
  selected: boolean;
  today: boolean;
  outside: boolean;
  disabled: boolean;
  muted?: boolean;
  count: number;
  rowHeight: number;
  onSelect: (date: string) => void;
};

export function CalendarDay({
  date,
  selected,
  today,
  outside,
  disabled,
  muted,
  count,
  rowHeight,
  onSelect,
}: CalendarDayProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatKoreanDate(date)}, 근무 ${count}건${today ? ', 오늘' : ''}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => onSelect(date)}
      style={[styles.root, { height: rowHeight }]}
    >
      <View
        style={[
          styles.circle,
          today && [styles.today, { backgroundColor: colors.surfaceBlueSubtle }],
          selected && { backgroundColor: colors.surfaceBlueStrong },
        ]}
      >
        <Text
          weight="medium"
          color={
            selected
              ? 'foregroundInverse'
              : outside || muted
                ? 'foregroundDisabled'
                : 'foregroundStrong'
          }
        >
          {Number(date.slice(8))}
        </Text>
      </View>
      <View accessible={false} importantForAccessibility="no" style={styles.dots}>
        {Array.from({ length: Math.min(count, 3) }, (_, index) => (
          <View key={index} style={[styles.dot, { backgroundColor: colors.surfaceBlueStrong }]} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: `${100 / 7}%`, alignItems: 'center', paddingTop: 2, gap: 6 },
  circle: {
    minWidth: 32,
    minHeight: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {},
  dots: { height: 4, flexDirection: 'row', gap: 2 },
  dot: { width: 4, height: 4, borderRadius: radius.full },
});
