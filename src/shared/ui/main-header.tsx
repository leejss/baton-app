import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/shared/ui/Pressable';
import { Text } from '@/shared/ui/Text';
import { NavNotification } from '@/shared/ui/icons';
import { radius, SCREEN_PADDING_X, spacing, useTheme } from '@/theme';

export type MainHeaderModel = {
  badgeText?: string;
  roleLabel: string;
  storeLabel: string;
};

type MainHeaderProps = {
  model: MainHeaderModel;
  onNotificationPress: () => void;
};

/** 메인 탭들이 같은 매장 정보·알림 헤더를 공유하도록 표현을 한곳에 둔다. */
export function MainHeader({ model, onNotificationPress }: MainHeaderProps) {
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
  // TODO(design-system): Figma node 732:17460의 홈 배경, 62px 헤더와 10px 간격을 토큰으로 동기화한다.
  root: {
    minHeight: 62,
    backgroundColor: '#F1F6FF',
  },
  inner: {
    width: '100%',
    maxWidth: 393,
    minHeight: 62,
    paddingHorizontal: SCREEN_PADDING_X,
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
