import { QueryBoundary } from '@/shared/ui/QueryBoundary';
import { QueryRefreshNotice } from '@/shared/ui/QueryRefreshNotice';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { mapHomeScheduleModel } from '@/features/home/api/mappers';
import { homeQueries } from '@/features/home/api/home.queries';
import { HomeShiftRow } from '@/features/home/components/HomeShiftRow';
import { WeekDayButton } from '@/features/home/components/WeekDayButton';
import { formatHomeDateTitle, getHomeWeekDays } from '@/features/home/lib/homeDate';
import { Text } from '@/shared/ui';
import { ArrowRightS } from '@/shared/ui/icons';
import { shadows, spacing, useTheme } from '@/theme';

type WeekScheduleCardProps = {
  currentUserId: number;
  initialDate: string;
  onCreateHandoff: (userId: number) => void;
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
  const title = formatHomeDateTitle(selectedDate);
  const weekDays = getHomeWeekDays(selectedDate);
  const handleDetailsPress = () => onDetailsPress(selectedDate);
  const handleQueryRetry = () => void summaryQuery.refetch();

  return (
    <View style={[styles.card, shadows.default, { backgroundColor: theme.colors.background }]}>
      <Pressable
        accessibilityLabel={`${title} 월간 근무표 보기`}
        accessibilityRole="button"
        onPress={handleDetailsPress}
        style={({ pressed }) => [styles.titleButton, pressed && styles.pressed]}
      >
        <Image
          source={require('@/assets/images/home/section-marker.svg')}
          contentFit="fill"
          accessible={false}
          style={styles.marker}
        />
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

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <QueryBoundary query={summaryQuery}>
          <QueryRefreshNotice
            failed={summaryQuery.isError && summaryQuery.data !== undefined}
            onRetry={handleQueryRetry}
          />
          {model &&
            (model.items.length === 0 ? (
              <Text color="textSecondary" style={styles.emptyText}>
                해당 날짜에 등록된 근무 일정이 없습니다.
              </Text>
            ) : (
              <View style={styles.shifts}>
                {model.items.map((item) => (
                  <HomeShiftRow key={item.id} item={item} onCreateHandoff={onCreateHandoff} />
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
    gap: 6,
    overflow: 'hidden',
  },
  titleButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  marker: {
    width: 18,
    height: 18,
  },
  content: {
    gap: 22,
  },
  week: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    width: '100%',
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
