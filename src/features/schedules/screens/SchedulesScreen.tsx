import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ROUTES } from '@/shared/lib/routes';
import { CalendarMonthHeader } from '@/features/schedules/components/CalendarMonthHeader';
import { DaySchedules } from '@/features/schedules/components/DaySchedules';
import { MonthlyCalendar } from '@/features/schedules/components/MonthlyCalendar';
import { ScheduleActions } from '@/features/schedules/components/ScheduleActions';
import { MainHeader } from '@/features/tabs/components/MainHeader';
import { ScheduleManageButton } from '@/features/schedules/components/ScheduleManageButton';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';
import { useScheduleClock } from '@/features/schedules/hooks/useScheduleClock';
import {
  monthLimits,
  normalizeSelectedDate,
  shiftMonth,
} from '@/features/schedules/lib/scheduleDate';
import { getTodayInSeoul } from '@/shared/lib/date';
import { Text } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing, useTheme } from '@/theme';

type SchedulesScreenProps = {
  initialDate?: string;
  isManaging?: boolean;
};

export function SchedulesScreen({ initialDate, isManaging = false }: SchedulesScreenProps) {
  const now = useScheduleClock();
  const today = getTodayInSeoul(now);
  const [selectedDate, setSelectedDate] = useState(() => normalizeSelectedDate(initialDate, today));
  const [month, setMonth] = useState(() =>
    (normalizeSelectedDate(initialDate, today) ?? today).slice(0, 7),
  );
  const [selectedId, setSelectedId] = useState<number>();
  const [outOfRange, setOutOfRange] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();
  const handleMonthChange = (value: string) => {
    const { min, max } = monthLimits(today);
    if (value < min || value > max) {
      setOutOfRange(true);
      return;
    }
    setOutOfRange(false);
    setMonth(value);
    setSelectedDate(undefined);
  };
  const handleBack = () => (router.canGoBack() ? router.back() : router.navigate(ROUTES.home));
  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceNeutralSubtle }]}>
      <MainHeader
        title={isManaging ? '근무수정/삭제' : '근무표'}
        backgroundColor={isManaging ? colors.backgroundDefault : undefined}
        onBack={isManaging ? handleBack : undefined}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        <View style={[styles.calendar, { backgroundColor: colors.backgroundDefault }]}>
          <CalendarMonthHeader
            month={month}
            today={today}
            onChange={handleMonthChange}
            trailing={
              isManaging ? (
                <Text color="foregroundDisabled">근무편집</Text>
              ) : (
                <ScheduleManageButton date={selectedDate} />
              )
            }
          />
          <MonthlyCalendar
            month={month}
            today={today}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            onMoveMonth={(direction) => handleMonthChange(shiftMonth(month, direction))}
          />
          {outOfRange && (
            <ScheduleMessage message="현재 월 기준 과거 12개월부터 미래 3개월까지 조회할 수 있습니다." />
          )}
        </View>
        {selectedDate && (
          <View style={styles.list}>
            <DaySchedules
              key={selectedDate}
              date={selectedDate}
              now={now}
              isManaging={isManaging}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </View>
        )}
      </ScrollView>
      {selectedId !== undefined && (
        <ScheduleActions
          key={selectedId}
          id={selectedId}
          now={now}
          onClose={() => setSelectedId(undefined)}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: spacing.xl },
  calendar: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: 21,
    paddingBottom: 50,
  },
  list: { padding: SCREEN_PADDING_X },
});
