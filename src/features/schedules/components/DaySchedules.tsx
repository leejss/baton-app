import { QueryBoundary } from '@/shared/ui/QueryBoundary';
import { QueryRefreshNotice } from '@/shared/ui/QueryRefreshNotice';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';
import { ScheduleWorkerRow } from '@/features/schedules/components/ScheduleWorkerRow';
import type { ScheduleItem } from '@/features/schedules/types';
import { canEditSchedule } from '@/features/schedules/lib/schedulePolicy';
import { formatKoreanDate } from '@/shared/lib/formatters';
import { IllustIcon, Pressable, Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

type DaySchedulesProps = {
  date: string;
  now: Date;
  isManaging?: boolean;
  selectedId?: number;
  onSelect: (id: number) => void;
};
const keyExtractor = (item: ScheduleItem) => String(item.id);

export function DaySchedules({
  date,
  now,
  isManaging = false,
  selectedId,
  onSelect,
}: DaySchedulesProps) {
  const context = useMainContext();
  const query = useInfiniteQuery(scheduleQueries.daily(context.workspaceId, date));
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const retry = () => {
    void query.refetch();
  };
  const loadMore = () => {
    if (query.hasNextPage && !query.isFetching) void query.fetchNextPage({ cancelRefetch: false });
  };
  if (!query.data)
    return (
      <QueryBoundary
        query={query}
        pendingFallback={<ScheduleMessage message="근무자 목록을 불러오는 중입니다." />}
      >
        {null}
      </QueryBoundary>
    );
  const items = query.data.pages.flatMap((page) => page.items);
  const workerCount = query.data.pages[0]?.totalEmployeeCount ?? 0;
  const renderItem = ({ item }: ListRenderItemInfo<ScheduleItem>) => (
    <ScheduleWorkerRow
      item={item}
      selected={item.id === selectedId}
      isManaging={isManaging}
      canEdit={canEditSchedule(item, context.userId, now)}
      onSelect={onSelect}
    />
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundDefault }]}>
      <QueryRefreshNotice failed={query.isRefetchError} onRetry={retry} />
      <View style={styles.titleRow}>
        <IllustIcon name="calendar" />
        <Text variant="title" weight="bold">
          {formatKoreanDate(date)}{' '}
          <Text variant="title" weight="bold" color="foregroundBlueSoft">
            총 {workerCount}명
          </Text>
        </Text>
      </View>
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Image
            source={require('@/assets/images/schedules/empty-schedule.png')}
            contentFit="contain"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={styles.emptyIllustration}
          />
          <Text
            variant="caption"
            weight="medium"
            color="foregroundDisabled"
            style={styles.emptyText}
          >
            해당 날짜에 등록된{`\n`}근무 일정이 없습니다.
          </Text>
        </View>
      ) : (
        <View
          style={{
            height: Math.min(items.length * Math.max(48, Math.ceil(fontScale * 32) + 16), 432),
          }}
        >
          <FlashList
            data={items}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            nestedScrollEnabled
            contentInsetAdjustmentBehavior="automatic"
          />
        </View>
      )}
      {query.isFetchNextPageError && (
        <Text variant="bodySmall" color="foregroundWarningDefault">
          다음 근무 일정을 불러오지 못했습니다. 다시 시도해주세요.
        </Text>
      )}
      {query.hasNextPage && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            query.isFetchNextPageError ? '근무 일정 더 보기 다시 시도' : '전체 근무 일정 더 보기'
          }
          accessibilityState={{ disabled: query.isFetching, busy: query.isFetchingNextPage }}
          disabled={query.isFetching}
          onPress={loadMore}
          style={styles.more}
        >
          <Text variant="bodySmall" color="foregroundSubtle">
            {query.isFetchingNextPage
              ? '불러오는 중…'
              : query.isFetchNextPageError
                ? '다시 시도'
                : '더 보기'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 26,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyState: {
    width: '100%',
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyIllustration: { width: 64, height: 56 },
  emptyText: { textAlign: 'center' },
  more: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
