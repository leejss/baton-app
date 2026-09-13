import { QueryBoundary } from '@/shared/ui/QueryBoundary';
import { QueryRefreshNotice } from '@/shared/ui/QueryRefreshNotice';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { ROUTES } from '@/shared/lib/routes';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { ScheduleMessage } from '@/features/schedules/components/ScheduleMessage';
import { ScheduleWorkerRow } from '@/features/schedules/components/ScheduleWorkerRow';
import type { ScheduleItem } from '@/features/schedules/types';
import { canEditSchedule, daySchedules } from '@/features/schedules/lib/schedulePolicy';
import { formatKoreanDate } from '@/shared/lib/formatters';
import { IllustIcon, Pressable, Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

type DaySchedulesProps = {
  date: string;
  now: Date;
  isManaging?: boolean;
  onSelect: (id: number) => void;
};
const keyExtractor = (item: ScheduleItem) => String(item.id);

export function DaySchedules({ date, now, isManaging = false, onSelect }: DaySchedulesProps) {
  const context = useMainContext();
  const query = useQuery(scheduleQueries.month(context.storeId ?? 0, date.slice(0, 7)));
  const [expanded, setExpanded] = useState(false);
  const { colors } = useTheme();
  const router = useRouter();
  const { fontScale } = useWindowDimensions();
  const retry = () => {
    void query.refetch();
  };
  if (!query.data) return <QueryBoundary query={query}>{null}</QueryBoundary>;
  if (isManaging && !context.canManage)
    return <ScheduleMessage message="관리자만 근무 일정을 편집할 수 있습니다." />;
  const model = daySchedules(query.data, date, context.userId);
  const items = expanded || isManaging ? model.all : model.preview;
  const handleHandoff = (id: number) => router.push(ROUTES.handoffs.createForRecipient(String(id)));
  const renderItem = ({ item }: ListRenderItemInfo<ScheduleItem>) => (
    <ScheduleWorkerRow
      item={item}
      canHandoff={item.member.isActive && item.member.id !== context.userId}
      isManaging={isManaging}
      canEdit={canEditSchedule(item, context.canManage ?? false, now)}
      onHandoff={handleHandoff}
      onSelect={onSelect}
    />
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundDefault }]}>
      <QueryRefreshNotice failed={query.isError} onRetry={retry} />
      <View style={styles.titleRow}>
        <IllustIcon name="calendar" />
        <Text variant="title" weight="bold">
          {formatKoreanDate(date)}{' '}
          <Text variant="title" weight="bold" color="foregroundBlueSoft">
            총 {model.workerCount}명
          </Text>
        </Text>
      </View>
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
          <Text variant="bodySmall" color="foregroundSubtle">
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  more: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
