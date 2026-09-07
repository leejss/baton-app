import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import type { ScheduleDataSource } from '@/features/schedules/api/schedule.dataSource';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { Pressable, Text } from '@/shared/ui';
import { radius, spacing, useTheme } from '@/theme';

export function ScheduleStoreBadge({ source }: { source: ScheduleDataSource }) {
  const query = useQuery(scheduleQueries.context(source));
  const { colors } = useTheme();
  if (query.isError)
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="매장 정보 다시 조회"
        onPress={() => void query.refetch()}
        style={styles.retry}
      >
        <Text variant="caption">다시 시도</Text>
      </Pressable>
    );
  return (
    <View style={[styles.tag, { borderColor: colors.borderSubtle }]}>
      <Text numberOfLines={1} variant="caption" weight="semibold" color="textSecondary">
        {query.data?.storeName ?? '매장 정보 조회 중'}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  retry: { minHeight: 44, justifyContent: 'center' },
  // TODO(design-system): Figma 매장 chip의 154px 최대 폭·10px 안쪽 여백을 sync한다.
  tag: {
    maxWidth: 154,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderWidth: 1,
  },
});
