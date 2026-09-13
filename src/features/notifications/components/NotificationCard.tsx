import { StyleSheet, View } from 'react-native';

import type { Notification } from '@/features/notifications/types';
import { IllustIcon, Pressable, Text, type IllustIconName } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

type NotificationCardProps = {
  notification: Notification;
  isOpening: boolean;
  onPress: (notification: Notification) => void;
};

const NOTIFICATION_ILLUST_ICONS = {
  announcement: 'announcement',
  handoffReceived: 'handoffReceived',
  handoffConfirmed: 'handoffConfirmed',
  schedule: 'workSchedule',
} as const satisfies Record<Notification['kind'], IllustIconName>;

// Figma 943:103882의 치수. 전역 스케일을 변경하지 않고 이 카드에만 한정한다.
const CARD = {
  radius: 16,
  paddingVertical: 18,
  iconGap: 14,
  textGap: 6,
  dotSize: 6,
} as const;

export function NotificationCard({ notification, isOpening, onPress }: NotificationCardProps) {
  const { colors } = useTheme();
  const handlePress = () => onPress(notification);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${notification.isUnread ? '읽지 않음, ' : ''}${notification.heading}, ${notification.message}, ${notification.timeLabel}`}
      accessibilityHint={
        notification.target.kind === 'none'
          ? '알림을 읽음 처리합니다'
          : '연결된 화면으로 이동합니다'
      }
      accessibilityState={{ busy: isOpening, disabled: isOpening }}
      disabled={isOpening}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.backgroundDefault },
        pressed && styles.pressed,
      ]}
    >
      <IllustIcon name={NOTIFICATION_ILLUST_ICONS[notification.kind]} />
      <View style={styles.content}>
        <Text variant="caption" weight="semibold">
          {notification.heading}
        </Text>
        <Text variant="bodySmall" weight="medium" color="foregroundDefault">
          {notification.message}
        </Text>
        <Text variant="caption" color="foregroundSubtle">
          {notification.timeLabel}
        </Text>
      </View>
      <View style={styles.dotSlot}>
        {notification.isUnread && (
          <View style={[styles.dot, { backgroundColor: colors.surfaceBlueStrong }]} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: CARD.iconGap,
    borderRadius: CARD.radius,
    paddingHorizontal: spacing.md,
    paddingVertical: CARD.paddingVertical,
    marginBottom: spacing.md,
  },
  content: { flex: 1, minWidth: 0, gap: CARD.textGap },
  dotSlot: { width: CARD.dotSize, height: CARD.dotSize },
  dot: {
    width: CARD.dotSize,
    height: CARD.dotSize,
    borderRadius: CARD.dotSize / 2,
  },
  pressed: { opacity: 0.7 },
});
