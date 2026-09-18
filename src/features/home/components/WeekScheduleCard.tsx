import { QueryBoundary } from '@/shared/ui/QueryBoundary';
import { QueryRefreshNotice } from '@/shared/ui/QueryRefreshNotice';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { mapHomeScheduleModel } from '@/features/home/api/mappers';
import { homeQueries } from '@/features/home/api/home.queries';
import { HomeShiftRow } from '@/features/home/components/HomeShiftRow';
import { WeekDayButton } from '@/features/home/components/WeekDayButton';
import { getHomeWeekDays } from '@/features/home/lib/homeDate';
import { formatKoreanDate } from '@/shared/lib/formatters';
import { IllustIcon, Text } from '@/shared/ui';
import { ArrowRightS } from '@/shared/ui/icons';
import { shadows, spacing, useTheme } from '@/theme';

type WeekScheduleCardProps = {
  currentUserId: number;
  initialDate: string;
  onCreateHandoff: (userId: number, workDate: string) => void;
  onDetailsPress: (date: string) => void;
  storeId: number;
};

export function WeekScheduleCard({
  currentUserId,
  initialDate,
  onCreateHandoff,
  onDetailsPress,
  storeId,
}: WeekScheduleCardProps) {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const summaryQuery = useQuery(homeQueries.summary(storeId, selectedDate));
  const model =
    summaryQuery.data === undefined
      ? undefined
      : mapHomeScheduleModel(currentUserId, summaryQuery.data, selectedDate);
  const title = formatKoreanDate(selectedDate);
  const weekDays = getHomeWeekDays(selectedDate);
  const handleDetailsPress = () => onDetailsPress(selectedDate);
  const handleCreateHandoff = (userId: number) => onCreateHandoff(userId, selectedDate);
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
          {model &&
            (model.items.length === 0 ? (
              <Text color="foregroundDefault" style={styles.emptyText}>
                해당 날짜에 등록된 근무 일정이 없습니다.
              </Text>
            ) : (
              <View style={styles.shifts}>
                {model.items.map((item) => (
                  <HomeShiftRow key={item.id} item={item} onCreateHandoff={handleCreateHandoff} />
                ))}
              </View>
            ))}
        </QueryBoundary>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): Figma node 1095:31293의 흰 surface, 24px radius, 18/22/26/28px 값은 홈에만 격리한다.
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
