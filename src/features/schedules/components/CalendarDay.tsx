import { StyleSheet, View } from 'react-native';

import { dateLabel } from '@/features/schedules/lib/scheduleDate';
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
      accessibilityLabel={`${dateLabel(date)}, 근무 ${count}건${today ? ', 오늘' : ''}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => onSelect(date)}
      style={[styles.root, { height: rowHeight }]}
    >
      <View
        style={[
          styles.circle,
          today && styles.today,
          selected && { backgroundColor: colors.accent },
        ]}
      >
        <Text
          weight="medium"
          color={selected ? 'accentOn' : outside || muted ? 'textDisabled' : 'textPrimary'}
        >
          {Number(date.slice(8))}
        </Text>
      </View>
      <View accessible={false} importantForAccessibility="no" style={styles.dots}>
        {Array.from({ length: Math.min(count, 3) }, (_, index) => (
          <View key={index} style={[styles.dot, { backgroundColor: colors.accent }]} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: `${100 / 7}%`, alignItems: 'center', paddingTop: 2, gap: 6 },
  // TODO(design-system): Figma 1097:36402의 32px 날짜 원·2/6px 간격·오늘 #DBEAFE 배경을 시맨틱 토큰과 sync한다.
  circle: {
    minWidth: 32,
    minHeight: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: { backgroundColor: '#DBEAFE' },
  dots: { height: 4, flexDirection: 'row', gap: 2 },
  dot: { width: 4, height: 4, borderRadius: radius.full },
});
