import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { mockHomeDataSource } from '@/features/home/api/home.mockDataSource';
import { homeQueries } from '@/features/home/api/home.queries';
import type { ScheduleDataSource } from '@/features/schedules/api/schedule.dataSource';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { Pressable, Text } from '@/shared/ui';
import { NavNotification } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

export function ScheduleNotificationButton({ source }: { source: ScheduleDataSource }) {
  const router = useRouter();
  const { colors } = useTheme();
  const context = useQuery(scheduleQueries.context(source));
  const query = useQuery({
    ...homeQueries.notifications(mockHomeDataSource, context.data?.storeId ?? 0),
    enabled: context.data !== undefined,
  });
  const count = query.data?.unreadCount ?? 0;
  const badge = count > 99 ? '99+' : String(count);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count ? `알림, 읽지 않은 알림 ${badge}개` : '알림'}
      onPress={() => router.push('/notifications')}
      style={styles.button}
    >
      <NavNotification />
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Text variant="caption" color="accentOn" style={styles.label}>
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  // TODO(design-system): 알림 숫자 badge의 18px 크기·10/12px 글자 크기를 sync한다.
  button: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  label: { fontSize: 10, lineHeight: 12 },
});
