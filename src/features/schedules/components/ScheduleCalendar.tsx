import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { CalendarDay } from '@/features/schedules/components/CalendarDay';
import { calendarDates } from '@/features/schedules/lib/scheduleDate';
import type { DateRange } from '@/features/schedules/model/schedule';
import { Text } from '@/shared/ui';

type ScheduleCalendarProps = {
  month: string;
  today: string;
  selectedDate?: string;
  range?: DateRange;
  mode?: 'single' | 'range' | 'readonly';
  counts?: Readonly<Record<string, number>>;
  minDate?: string;
  compact?: boolean;
  onSelect: (date: string) => void;
  onRange?: (range: DateRange) => void;
  onMoveMonth?: (direction: number) => void;
};

/** 순수 캘린더: 서버·라우터와 무관하며 조회/등록/수정에서 함께 사용한다. */
export function ScheduleCalendar({
  month,
  today,
  selectedDate,
  range,
  mode = 'single',
  counts = {},
  minDate,
  compact = false,
  onSelect,
  onRange,
  onMoveMonth,
}: ScheduleCalendarProps) {
  const [width, setWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const rowHeight = Math.max(60, Math.ceil(fontScale * 28) + 24);
  const allDates = calendarDates(month);
  const selectedIndex = allDates.indexOf(range?.start || selectedDate || today);
  // 여러 주에 걸친 범위는 축약해서 숨기지 않는다.
  const canCompact =
    compact &&
    selectedIndex >= 0 &&
    (!range || Math.floor(allDates.indexOf(range.end) / 7) === Math.floor(selectedIndex / 7));
  const dates = canCompact
    ? allDates.slice(Math.floor(selectedIndex / 7) * 7, Math.floor(selectedIndex / 7) * 7 + 7)
    : allDates;
  const anchor = useSharedValue(-1);
  const last = useSharedValue(-1);
  const selectRange = (first: number, end: number) => {
    const a = dates[first];
    const b = dates[end];
    if (!a || !b || !a.startsWith(month) || !b.startsWith(month)) return;
    const start = a < b ? a : b;
    if (minDate && start < minDate) return;
    onRange?.({ start, end: a < b ? b : a });
  };
  const drag = Gesture.Pan()
    .enabled(mode === 'range' && width > 0)
    .activateAfterLongPress(220)
    .onStart((event) => {
      anchor.value = Math.floor(event.y / rowHeight) * 7 + Math.floor(event.x / (width / 7));
      last.value = anchor.value;
      scheduleOnRN(selectRange, anchor.value, anchor.value);
    })
    .onUpdate((event) => {
      if (event.x < 0 || event.x >= width || event.y < 0) return;
      const index = Math.floor(event.y / rowHeight) * 7 + Math.floor(event.x / (width / 7));
      if (index !== last.value) {
        last.value = index;
        scheduleOnRN(selectRange, anchor.value, index);
      }
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
            <Text variant="caption" color={day === '일' ? 'dangerText' : 'textDisabled'}>
              {day}
            </Text>
          </View>
        ))}
      </View>
      <GestureDetector gesture={Gesture.Race(drag, swipe)}>
        <View
          collapsable={false}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={styles.grid}
        >
          {dates.map((date) => (
            <CalendarDay
              key={date}
              date={date}
              today={date === today}
              selected={range ? date >= range.start && date <= range.end : date === selectedDate}
              outside={!date.startsWith(month)}
              disabled={
                mode === 'readonly' || !date.startsWith(month) || Boolean(minDate && date < minDate)
              }
              muted={Boolean(minDate && date < minDate)}
              count={counts[date] ?? 0}
              rowHeight={rowHeight}
              onSelect={onSelect}
            />
          ))}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): Figma 캘린더의 요일 행 높이 22px·아래 여백 14px와 날짜 행 최소 60px를 sync한다.
  weekdays: { flexDirection: 'row', paddingBottom: 14 },
  weekday: { width: `${100 / 7}%`, alignItems: 'center', minHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
