import { StyleSheet, View } from 'react-native';

import { ROUTES } from '@/shared/lib/routes';
import { NotificationList } from '@/features/notifications/components/NotificationList';
import { MainHeader } from '@/features/tabs/components/MainHeader';
import { goBackOr } from '@/shared/lib/navigation';
import { QueryBoundary } from '@/shared/ui';
import { useTheme } from '@/theme';

const handleBack = () => goBackOr(ROUTES.home);

export function NotificationsScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundSubtle }]}>
      <MainHeader title="알림" onBack={handleBack} showNotification={false} />
      <QueryBoundary>
        <NotificationList />
      </QueryBoundary>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
