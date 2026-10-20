import { QueryBoundary } from '@/shared/ui/QueryBoundary';
import { QueryRefreshNotice } from '@/shared/ui/QueryRefreshNotice';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { mapHomeShifts } from '@/features/home/api/mappers';
import { homeQueries } from '@/features/home/api/home.queries';
import { HomeShiftRow } from '@/features/home/components/HomeShiftRow';
import { WeekDayButton } from '@/features/home/components/WeekDayButton';
import { getHomeWeekDays } from '@/features/home/lib/homeDate';
import { formatKoreanDate } from '@/shared/lib/formatters';
import { IllustIcon, Text } from '@/shared/ui';
import { ArrowRightS } from '@/shared/ui/icons';
import { shadows, spacing, useTheme } from '@/theme';

type WeekScheduleCardProps = {
  initialDate: string;
  onDetailsPress: (date: string) => void;
  workspaceId: number;
};

export function WeekScheduleCard({
  initialDate,
  onDetailsPress,
  workspaceId,
}: WeekScheduleCardProps) {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const summaryQuery = useQuery(homeQueries.summary(workspaceId, selectedDate));
  const shifts = summaryQuery.data === undefined ? undefined : mapHomeShifts(summaryQuery.data);
  const title = formatKoreanDate(selectedDate);
  const weekDays = getHomeWeekDays(selectedDate);
  const handleDetailsPress = () => onDetailsPress(selectedDate);
  const handleQueryRetry = () => void summaryQuery.refetch();

  return (
    <View
      style={[styles.card, shadows.default, { backgroundColor: theme.colors.backgroundDefault }]}
    >
      <Pressable
        accessibilityLabel={`${title} 월간 근무표 보기`}
        accessibilityRole="button"
        hitSlop={9}
        onPress={handleDetailsPress}
        style={({ pressed }) => [styles.titleButton, pressed && styles.pressed]}
      >
        <IllustIcon name="calendar" size={22} />
        <Text variant="title" weight="semibold">
          {title}
        </Text>
        <ArrowRightS size={22} />
      </Pressable>

      <View style={styles.content}>
        <View accessibilityRole="tablist" style={styles.week}>
          {weekDays.map((day) => (
            <WeekDayButton key={day.date} day={day} onSelect={setSelectedDate} />
          ))}
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.borderSubtle }]} />
        </View>

        <QueryBoundary query={summaryQuery}>
          <QueryRefreshNotice
            failed={summaryQuery.isError && summaryQuery.data !== undefined}
            onRetry={handleQueryRetry}
          />
          {shifts &&
            (shifts.length === 0 ? (
              <Text color="foregroundDefault" style={styles.emptyText}>
                해당 날짜에 등록된 근무 일정이 없습니다.
              </Text>
            ) : (
              <View style={styles.shifts}>
                {shifts.map((item) => (
                  <HomeShiftRow key={item.id} item={item} />
                ))}
              </View>
            ))}
        </QueryBoundary>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 26,
    borderRadius: 24,
    gap: spacing.lg,
    overflow: 'hidden',
  },
  titleButton: {
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    gap: 22,
  },
  week: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    width: '100%',
    height: 0,
  },
  dividerLine: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 1,
  },
  shifts: {
    gap: spacing.md,
  },
  emptyText: {
    minHeight: 44,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  pressed: { opacity: 0.65 },
});
