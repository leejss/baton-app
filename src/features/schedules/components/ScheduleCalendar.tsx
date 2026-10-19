import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

import { CalendarDay } from '@/features/schedules/components/CalendarDay';
import { calendarDates } from '@/features/schedules/lib/scheduleDate';
import { Text } from '@/shared/ui';

type ScheduleCalendarProps = {
  month: string;
  today: string;
  selectedDate?: string;
  mode?: 'single' | 'readonly';
  counts?: Readonly<Record<string, number>>;
  minDate?: string;
  compact?: boolean;
  onSelect: (date: string) => void;
  onMoveMonth?: (direction: number) => void;
};

/** 순수 캘린더: 서버·라우터와 무관하며 조회/등록/수정에서 함께 사용한다. */
export function ScheduleCalendar({
  month,
  today,
  selectedDate,
  mode = 'single',
  counts = {},
  minDate,
  compact = false,
  onSelect,
  onMoveMonth,
}: ScheduleCalendarProps) {
  const { fontScale } = useWindowDimensions();
  const minimumDateRowHeight = Math.max(60, Math.ceil(fontScale * 28) + 24);
  const allDates = calendarDates(month);
  const selectedIndex = allDates.indexOf(selectedDate || today);
  const canCompact = compact && selectedIndex >= 0;
  const dates = canCompact
    ? allDates.slice(Math.floor(selectedIndex / 7) * 7, Math.floor(selectedIndex / 7) * 7 + 7)
    : allDates;
  const weekCount = Math.ceil(dates.length / 7);
  const rowHeights = Array.from({ length: weekCount }, (_, index) => {
    if (weekCount === 1) return minimumDateRowHeight;
    if (index === 0) return minimumDateRowHeight + 4;
    if (index === weekCount - 1) return Math.max(46, minimumDateRowHeight - 14);
    return minimumDateRowHeight;
  });
  const swipe = Gesture.Pan()
    .enabled(onMoveMonth !== undefined)
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 50 && onMoveMonth)
        scheduleOnRN(onMoveMonth, event.translationX < 0 ? 1 : -1);
    });

  return (
    <View>
      <View style={styles.weekdays}>
        {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
          <View key={day} style={styles.weekday}>
            <Text
              variant="caption"
              color={day === '일' ? 'foregroundWarningDefault' : 'foregroundDisabled'}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>
      <GestureDetector gesture={swipe}>
        <View collapsable={false} style={styles.grid}>
          {Array.from({ length: weekCount }, (_, rowIndex) => {
            const week = dates.slice(rowIndex * 7, rowIndex * 7 + 7);
            return (
              <View
                key={`week-${rowIndex}`}
                style={[styles.weekRow, { height: rowHeights[rowIndex] }]}
              >
                {week.map((date) => (
                  <CalendarDay
                    key={date}
                    date={date}
                    today={date === today}
                    selected={date === selectedDate}
                    outside={!date.startsWith(month)}
                    disabled={
                      mode === 'readonly' ||
                      !date.startsWith(month) ||
                      Boolean(minDate && date < minDate)
                    }
                    muted={Boolean(minDate && date < minDate)}
                    count={counts[date] ?? 0}
                    rowHeight={rowHeights[rowIndex]}
                    onSelect={onSelect}
                  />
                ))}
              </View>
            );
          })}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  weekdays: { flexDirection: 'row', paddingBottom: 14 },
  weekday: { width: `${100 / 7}%`, alignItems: 'center', minHeight: 22 },
  grid: { width: '100%' },
  weekRow: { width: '100%', flexDirection: 'row' },
});
