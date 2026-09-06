import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { HomeHeaderModel } from '@/features/home/types';
import { Text } from '@/shared/ui';
import { NavNotification } from '@/shared/ui/icons';
import { radius, spacing, useTheme } from '@/theme';

type HomeHeaderProps = {
  model: HomeHeaderModel;
  onNotificationPress: () => void;
};

export function HomeHeader({ model, onNotificationPress }: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const notificationLabel =
    model.badgeText === undefined ? '알림' : `알림, 읽지 않은 알림 ${model.badgeText}개`;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <Image
          source={require('@/assets/images/home/baton-wordmark.svg')}
          contentFit="fill"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={styles.wordmark}
        />

        <View style={styles.trailing}>
          <View
            accessibilityLabel={`${model.storeLabel}, ${model.roleLabel}`}
            style={[
              styles.storeTag,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.surfaceSunken,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              variant="caption"
              weight="medium"
              style={styles.storeName}
            >
              {model.storeLabel}
            </Text>
            <Text variant="caption" weight="medium">
              {' / '}
              {model.roleLabel}
            </Text>
          </View>

          <Pressable
            accessibilityLabel={notificationLabel}
            accessibilityRole="button"
            onPress={onNotificationPress}
            style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}
          >
            <NavNotification color="navigationForeground" />
            {model.badgeText !== undefined && (
              <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
                <Text color="accentOn" variant="caption" weight="semibold" style={styles.badgeText}>
                  {model.badgeText}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): Figma node 732:17460의 홈 배경, 62px 헤더와 10/18px 간격은 현재 토큰에 없어 홈에만 둔다.
  root: {
    minHeight: 62,
    backgroundColor: '#F1F6FF',
  },
  inner: {
    width: '100%',
    maxWidth: 393,
    minHeight: 62,
    paddingHorizontal: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 14,
    paddingBottom: 20,
  },
  wordmark: {
    width: 73,
    height: 20,
    flexShrink: 0,
  },
  trailing: {
    minWidth: 0,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'flex-end',
    // gap: 0,
  },
  storeTag: {
    maxWidth: 200,
    minWidth: 0,
    flexShrink: 1,
    minHeight: 24,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  storeName: {
    flexShrink: 1,
    minWidth: 0,
  },
  notificationButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: -8,
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontVariant: ['tabular-nums'],
  },
  pressed: { opacity: 0.6 },
});
