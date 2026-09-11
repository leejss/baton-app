import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ROUTES } from '@/shared/lib/routes';
import { NotificationList } from '@/features/notifications/components/NotificationList';
import { MainHeader } from '@/features/tabs/components/MainHeader';
import { goBackOr } from '@/shared/lib/navigation';
import { QueryBoundary } from '@/shared/ui';
import { AppTabBar, type AppTabName } from '@/shared/ui/AppTabBar';
import { useTheme } from '@/theme';

const TAB_PATHS = {
  home: ROUTES.home,
  schedules: ROUTES.schedules.index,
  handoffs: ROUTES.handoffs.index,
  my: ROUTES.my,
} as const;
const handleBack = () => goBackOr(ROUTES.home);

export function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const handleTabPress = (tab: AppTabName) => router.dismissTo(TAB_PATHS[tab]);
  const handleCompose = () => router.push(ROUTES.handoffs.new.index);

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <MainHeader title="알림" onBack={handleBack} />
      <QueryBoundary>
        <NotificationList />
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
