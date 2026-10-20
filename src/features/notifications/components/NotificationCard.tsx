import { StyleSheet, View } from 'react-native';

import type { Notification } from '@/features/notifications/types';
import { IllustIcon, Pressable, Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

type NotificationCardProps = {
  notification: Notification;
  isOpening: boolean;
  onPress: (notification: Notification) => void;
};

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
      <IllustIcon name={notification.kind} />
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
    gap: 14,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 18,
    marginBottom: spacing.md,
  },
  content: { flex: 1, minWidth: 0, gap: 6 },
  dotSlot: { width: 6, height: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pressed: { opacity: 0.7 },
});
