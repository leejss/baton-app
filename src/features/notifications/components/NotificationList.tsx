import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

import { notificationQueries } from '@/features/notifications/api/notification.queries';
import { NotificationCard } from '@/features/notifications/components/NotificationCard';
import { useOpenNotification } from '@/features/notifications/hooks/useOpenNotification';
import type { Notification } from '@/features/notifications/types';
import { EmptyState, Snackbar, Text } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing } from '@/theme';

const keyExtractor = (notification: Notification) => notification.id;

const FEEDBACK = {
  /** Figma node 1254:26619 Notification Layout의 내부 상하 패딩. */
  paddingVertical: 14,
  /** 홈 인디케이터와 알림 사이의 시안 여백. */
  bottomGap: 4,
} as const;

export function NotificationList() {
  const context = useMainContext();
  const insets = useSafeAreaInsets();
  const scope = {
    storeId: context.membership.store.id,
    userId: context.profile.id,
  };
  const { data, refetch, isRefetchError } = useSuspenseQuery(notificationQueries.list(scope));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { open, openingId, message, clearMessage } = useOpenNotification(scope);

  // useFocusEffect는 콜백 참조가 달라지면 다시 실행하므로 안정된 참조가 필요하다.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };
  const handlePress = (notification: Notification) => {
    void open(notification);
  };
  const renderItem = ({ item }: ListRenderItemInfo<Notification>) => (
    <NotificationCard notification={item} isOpening={openingId === item.id} onPress={handlePress} />
  );

  return (
    <View style={styles.root}>
      <FlashList
        data={data.items}
        extraData={openingId}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <EmptyState
            title="아직 알림이 없어요"
            description="새로운 소식이 도착하면 알려드릴게요."
          />
        }
        ListFooterComponent={
          <Text variant="bodySmall" color="foregroundSubtle" style={styles.footer}>
            알림은 최신순으로 30일까지 보관됩니다.
          </Text>
        }
      />
      {(message || isRefetchError) && (
        <View
          pointerEvents="box-none"
          style={[styles.feedback, { bottom: insets.bottom + FEEDBACK.bottomGap }]}
        >
          <Snackbar
            title={message ?? '알림을 새로 불러오지 못했어요.'}
            actionLabel={message ? '닫기' : '다시 시도'}
            onAction={message ? clearMessage : handleRefresh}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    textAlign: 'center',
  },
  feedback: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: FEEDBACK.paddingVertical,
  },
});
