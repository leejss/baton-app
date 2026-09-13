import { ScrollView, StyleSheet } from 'react-native';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { monthLimits, shiftMonth } from '@/features/schedules/lib/scheduleDate';
import { formatKoreanMonth } from '@/shared/lib/formatters';
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
    <BottomSheet visible={visible} title="조회 월 선택" onDismiss={onClose}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.list}
        contentOffset={{ x: 0, y: Math.max(0, months.indexOf(month) * 48 - 144) }}
      >
        {months.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={formatKoreanMonth(value)}
            accessibilityState={{ selected: month === value }}
            onPress={() => {
              onSelect(value);
              onClose();
            }}
            style={[styles.item, month === value && { backgroundColor: colors.surfaceBlueDefault }]}
          >
            <Text weight={month === value ? 'semibold' : 'regular'}>
              {formatKoreanMonth(value)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </BottomSheet>
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
