import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { NotificationDataSource } from '@/features/notifications/api/notification.dataSource';
import { mockNotificationDataSource } from '@/features/notifications/api/mockNotificationDataSource';
import { NotificationList } from '@/features/notifications/components/NotificationList';
import { MainHeader } from '@/features/tabs/components/MainHeader';
import { goBackOr } from '@/shared/lib/navigation';
import { QueryBoundary } from '@/shared/ui';
import { AppTabBar, type AppTabName } from '@/shared/ui/AppTabBar';
import { useTheme } from '@/theme';

type NotificationsScreenProps = { source?: NotificationDataSource };

const TAB_PATHS = {
  home: '/home',
  schedules: '/schedules',
  handoffs: '/handoffs',
  my: '/my',
} as const;
const handleBack = () => goBackOr('/home');

export function NotificationsScreen({
  source = mockNotificationDataSource,
}: NotificationsScreenProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const handleTabPress = (tab: AppTabName) => router.dismissTo(TAB_PATHS[tab]);
  const handleCompose = () => router.push('/handoffs/new');

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <MainHeader title="알림" onBack={handleBack} notificationSource={source} />
      <QueryBoundary resetKey={source.key}>
        <NotificationList source={source} />
      </QueryBoundary>
      <AppTabBar
        activeTab={null}
        onTabPress={handleTabPress}
        onTabLongPress={handleTabPress}
        onComposePress={handleCompose}
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
