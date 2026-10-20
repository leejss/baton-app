import type { ReactNode } from 'react';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MonthPicker } from '@/features/schedules/components/MonthPicker';
import { shiftMonth } from '@/features/schedules/lib/scheduleDate';
import { formatKoreanMonth } from '@/shared/lib/formatters';
import { Pressable, Text } from '@/shared/ui';
import { ArrowDownS } from '@/shared/ui/icons';

type CalendarMonthHeaderProps = {
  month: string;
  today: string;
  onChange: (month: string) => void;
  trailing?: ReactNode;
};

export function CalendarMonthHeader({
  month,
  today,
  onChange,
  trailing,
}: CalendarMonthHeaderProps) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="조회 월 선택"
          accessibilityActions={[
            { name: 'increment', label: '다음 월' },
            { name: 'decrement', label: '이전 월' },
          ]}
          onAccessibilityAction={(event) => {
            const next = shiftMonth(month, event.nativeEvent.actionName === 'increment' ? 1 : -1);
            onChange(next);
          }}
          onPress={() => setVisible(true)}
          style={styles.month}
        >
          <Text variant="heading" weight="semibold">
            {formatKoreanMonth(month)}
          </Text>
          <ArrowDownS size={24} color="foregroundDisabled" />
        </Pressable>
        {trailing}
      </View>
      <MonthPicker
        visible={visible}
        month={month}
        today={today}
        onSelect={onChange}
        onClose={() => setVisible(false)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { paddingBottom: 40 },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  month: { height: 32, flexDirection: 'row', alignItems: 'center', gap: 6 },
});
