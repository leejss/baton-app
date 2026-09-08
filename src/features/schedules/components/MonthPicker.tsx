import { ScrollView, StyleSheet } from 'react-native';

import { ScheduleOverlay } from '@/features/schedules/components/ScheduleOverlay';
import { monthLabel, monthLimits, shiftMonth } from '@/features/schedules/lib/scheduleDate';
import { Pressable, Text } from '@/shared/ui';
import { radius, spacing, useTheme } from '@/theme';

type MonthPickerProps = {
  visible: boolean;
  month: string;
  today: string;
  onSelect: (month: string) => void;
  onClose: () => void;
};

export function MonthPicker({ visible, month, today, onSelect, onClose }: MonthPickerProps) {
  const { colors } = useTheme();
  const { min, max } = monthLimits(today);
  const months: string[] = [];
  for (let value = min; value <= max; value = shiftMonth(value, 1)) months.push(value);
  return (
    <ScheduleOverlay sheet visible={visible} title="조회 월 선택" onClose={onClose}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.list}
        contentOffset={{ x: 0, y: Math.max(0, months.indexOf(month) * 48 - 144) }}
      >
        {months.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={monthLabel(value)}
            accessibilityState={{ selected: month === value }}
            onPress={() => {
              onSelect(value);
              onClose();
            }}
            style={[styles.item, month === value && { backgroundColor: colors.accentSubtle }]}
          >
            <Text weight={month === value ? 'semibold' : 'regular'}>{monthLabel(value)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </ScheduleOverlay>
  );
}
const styles = StyleSheet.create({
  // TODO(design-system): 월 선택 목록의 최대 높이 360px·행 높이 48px 기준을 sync한다.
  list: { maxHeight: 360 },
  item: {
    minHeight: 48,
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
