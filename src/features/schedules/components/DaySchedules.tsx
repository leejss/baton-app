import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import type { ScheduleDataSource } from '@/features/schedules/api/schedule.dataSource';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';
import { ScheduleWorkerRow } from '@/features/schedules/components/ScheduleWorkerRow';
import { dateLabel } from '@/features/schedules/lib/scheduleDate';
import type { ScheduleItem } from '@/features/schedules/model/schedule';
import { canEditSchedule, daySchedules } from '@/features/schedules/model/schedulePolicy';
import { Pressable, Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

type DaySchedulesProps = {
  source: ScheduleDataSource;
  date: string;
  now: Date;
  isManaging?: boolean;
  onSelect: (id: number) => void;
};
const keyExtractor = (item: ScheduleItem) => String(item.id);

export function DaySchedules({
  source,
  date,
  now,
  isManaging = false,
  onSelect,
}: DaySchedulesProps) {
  const context = useQuery(scheduleQueries.context(source));
  const query = useQuery(
    scheduleQueries.month(source, context.data?.storeId ?? 0, date.slice(0, 7)),
  );
  const [expanded, setExpanded] = useState(false);
  const { colors } = useTheme();
  const router = useRouter();
  const { fontScale } = useWindowDimensions();
  const retry = () => {
    void (context.isError ? context.refetch() : query.refetch());
  };
  if (context.isError || query.isError)
    return (
      <ScheduleMessage
        message="근무 일정 정보를 불러오지 못했습니다."
        onRetry={retry}
        isLoading={query.isFetching}
      />
    );
  if (!context.data || !query.data)
    return <ScheduleMessage message="근무자 목록을 불러오는 중입니다." />;
  if (isManaging && !context.data.canManage)
    return <ScheduleMessage message="관리자만 근무 일정을 편집할 수 있습니다." />;
  const model = daySchedules(query.data, date, context.data.userId);
  const items = expanded || isManaging ? model.all : model.preview;
  const handleHandoff = (id: number) =>
    router.push({
      pathname: '/handoffs/new',
      params: { recipientId: String(id) },
    });
  const renderItem = ({ item }: ListRenderItemInfo<ScheduleItem>) => (
    <ScheduleWorkerRow
      item={item}
      canHandoff={item.member.isActive && item.member.id !== context.data?.userId}
      isManaging={isManaging}
      canEdit={canEditSchedule(item, context.data?.canManage ?? false, now)}
      onHandoff={handleHandoff}
      onSelect={onSelect}
    />
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      <Text variant="title" weight="bold">
        {dateLabel(date)}{' '}
        <Text variant="title" weight="bold" color="accent">
          총 {model.workerCount}명
        </Text>
      </Text>
      {items.length === 0 ? (
        <ScheduleMessage message="해당 날짜에 등록된 근무 일정이 없습니다." />
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
      {!isManaging && !expanded && model.hasMore && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="전체 근무 일정 더 보기"
          onPress={() => setExpanded(true)}
          style={styles.more}
        >
          <Text variant="bodySmall" color="textTertiary">
            더 보기
          </Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  // TODO(design-system): Figma 1097:36712의 카드 radius 24·padding 18/24를 sync한다.
  card: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  more: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
