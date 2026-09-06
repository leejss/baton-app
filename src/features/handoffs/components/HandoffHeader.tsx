import { StyleSheet, View } from 'react-native';

import { Pressable, Text } from '@/shared/ui';
import { ArrowLeftS, NavNotificationBadge, X } from '@/shared/ui/icons';
import { spacing, useTheme } from '@/theme';

type HandoffHeaderProps = {
  title?: string;
  storeName?: string;
  leading?: 'back' | 'close' | 'none';
  onLeadingPress?: () => void;
  onNotificationPress?: () => void;
};

export function HandoffHeader({
  title,
  storeName,
  leading = 'back',
  onLeadingPress,
  onNotificationPress,
}: HandoffHeaderProps) {
  const theme = useTheme();
  const leadingLabel = leading === 'close' ? '작성 취소' : '뒤로 가기';

  return (
    <View style={styles.root}>
      <View style={styles.side}>
        {leading !== 'none' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={leadingLabel}
            hitSlop={spacing.sm}
            onPress={onLeadingPress}
            style={styles.iconButton}
          >
            {leading === 'close' ? <X /> : <ArrowLeftS />}
          </Pressable>
        )}
      </View>

      <View style={styles.center}>
        {title !== undefined && (
          <Text variant="title" weight="semibold" numberOfLines={1}>
            {title}
          </Text>
        )}
        {storeName !== undefined && (
          <View style={[styles.storeTag, { backgroundColor: theme.colors.border }]}>
            <Text variant="caption" weight="medium" numberOfLines={1}>
              {storeName}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.side}>
        {onNotificationPress !== undefined && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="알림 열기"
            hitSlop={spacing.sm}
            onPress={onNotificationPress}
            style={styles.iconButton}
          >
            <NavNotificationBadge />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): 인수인계 헤더의 56px 높이와 44px 액션 영역을 헤더 토큰으로 동기화한다.
  root: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  storeTag: {
    maxWidth: 112,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
});
