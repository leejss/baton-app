import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ScheduleDataSource } from '@/features/schedules/api/schedule.dataSource';
import { ScheduleNotificationButton } from '@/features/schedules/components/ScheduleNotificationButton';
import { ScheduleStoreBadge } from '@/features/schedules/components/ScheduleStoreBadge';
import { Pressable, Text } from '@/shared/ui';
import { ArrowLeftS } from '@/shared/ui/icons';
import { SCREEN_PADDING_X, useTheme } from '@/theme';

type ScheduleHeaderProps = {
  title: string;
  source: ScheduleDataSource;
  onBack: () => void;
  showStore?: boolean;
};

export function ScheduleHeader({ title, source, onBack, showStore = false }: ScheduleHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.background }}>
      <View style={styles.inner}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          onPress={onBack}
          hitSlop={6}
          style={styles.back}
        >
          <ArrowLeftS />
        </Pressable>
        <Text variant="subheading" weight="bold" style={styles.title}>
          {title}
        </Text>
        {showStore && (
          <>
            <ScheduleStoreBadge source={source} />
            <ScheduleNotificationButton source={source} />
          </>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  // TODO(design-system): Figma 1097:36396의 헤더 62px, 뒤로가기 24px 시각 영역을 sync한다.
  inner: {
    minHeight: 62,
    paddingHorizontal: SCREEN_PADDING_X,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  back: {
    width: 32,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
});
