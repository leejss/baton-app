import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isHomeDataSourceError, type HomeDataSource } from '@/features/home/api/home.dataSource';
import { mapHomeHandoffSectionModel } from '@/features/home/api/home.mapper';
import { homeMutations } from '@/features/home/api/home.mutations';
import { homeQueries } from '@/features/home/api/home.queries';
import { HandoffRow } from '@/features/home/components/HandoffRow';
import { HomeMessageState } from '@/features/home/components/HomeMessageState';
import { Text } from '@/shared/ui';
import { ArrowRightS } from '@/shared/ui/icons';
import { shadows, spacing, useTheme } from '@/theme';

type ConfirmationFeedback = {
  canRetry: boolean;
  handoffId: number;
  message: string;
};

type HandoffCardProps = {
  dataSource: HomeDataSource;
  date: string;
  onDetailsPress: () => void;
  storeId: number;
};

export function HandoffCard({ dataSource, date, onDetailsPress, storeId }: HandoffCardProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<ConfirmationFeedback>();
  const summaryQuery = useQuery(homeQueries.summary(dataSource, storeId, date));
  const model =
    summaryQuery.data === undefined ? undefined : mapHomeHandoffSectionModel(summaryQuery.data);
  const confirmMutation = useMutation({
    ...homeMutations.confirm(dataSource),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: homeQueries.summaryKey(storeId, date) }),
  });

  const handleConfirm = (handoverId: number) => {
    setFeedback(undefined);
    confirmMutation.mutate(handoverId, {
      onSuccess: () => setFeedback(undefined),
      onError: (error) => {
        const isAlreadyConfirmed =
          isHomeDataSourceError(error) && error.code === 'HANDOVER_ALREADY_CONFIRMED';

        setFeedback({
          handoffId: handoverId,
          canRetry: !isAlreadyConfirmed,
          message: isAlreadyConfirmed
            ? '이미 확인된 인수인계입니다.'
            : '인수인계를 확인 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
        });

        if (isAlreadyConfirmed) {
          void queryClient.invalidateQueries({
            queryKey: homeQueries.summaryKey(storeId, date),
          });
        }
      },
    });
  };
  const handleRetry = () => {
    if (feedback !== undefined) handleConfirm(feedback.handoffId);
  };
  const handleQueryRetry = () => void summaryQuery.refetch();

  return (
    <View style={styles.stack}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.decoration}
      />
      <View style={[styles.card, shadows.default, { backgroundColor: theme.colors.background }]}>
        <View style={styles.titleRow}>
          <Image
            source={require('@/assets/images/home/section-marker.svg')}
            contentFit="fill"
            accessible={false}
            style={styles.marker}
          />
          <View style={styles.titleTextRow}>
            <Text variant="title" weight="semibold">
              새 인수인계
            </Text>
            {model !== undefined && (
              <Text
                variant="title"
                weight="semibold"
                color={model.totalCount === 0 ? 'textDisabled' : 'accentText'}
                style={styles.count}
              >
                총 {model.totalCount}건
              </Text>
            )}
          </View>
        </View>

        {summaryQuery.isError ? (
          <HomeMessageState
            compact
            message="인수인계를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
            isLoading={summaryQuery.isFetching}
            onRetry={handleQueryRetry}
          />
        ) : summaryQuery.isPending || model === undefined ? (
          <HomeMessageState compact message="인수인계를 불러오는 중입니다." />
        ) : model.items.length === 0 ? (
          <Text color="textSecondary" style={styles.emptyText}>
            전달받은 인수인계가 없어요
          </Text>
        ) : (
          <>
            <View style={styles.list}>
              {model.items.map((item) => (
                <HandoffRow
                  key={item.id}
                  item={item}
                  isPending={confirmMutation.isPending && confirmMutation.variables === item.id}
                  onConfirm={handleConfirm}
                />
              ))}
            </View>

            {feedback !== undefined && (
              <View accessibilityLiveRegion="polite" style={styles.feedback}>
                <Text variant="bodySmall" color="dangerText" style={styles.feedbackMessage}>
                  {feedback.message}
                </Text>
                {feedback.canRetry && (
                  <Pressable
                    accessibilityLabel="인수인계 확인 다시 시도"
                    accessibilityRole="button"
                    onPress={handleRetry}
                    style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                  >
                    <Text variant="bodySmall" weight="semibold" color="dangerText">
                      다시 시도
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            <Pressable
              accessibilityLabel="전체 인수인계 자세히 보기"
              accessibilityRole="button"
              onPress={onDetailsPress}
              style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}
            >
              <Text variant="bodySmall" weight="medium" style={styles.detailsText}>
                자세히 보기
              </Text>
              <ArrowRightS size={16} color="textSecondary" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
  },
  // TODO(design-system): Figma node 732:17462/17468의 배경, 24px radius, 11/18/26/28px 값은 홈 전용 raw 값이다.
  decoration: {
    position: 'absolute',
    top: 10,
    right: 6,
    bottom: -2,
    left: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(46, 106, 228, 0.05)',
    transform: [{ rotate: '3.4deg' }],
  },
  card: {
    width: '100%',
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 26,
    borderRadius: 24,
    gap: spacing.lg,
    overflow: 'hidden',
  },
  titleRow: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  marker: {
    width: 18,
    height: 18,
  },
  titleTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  count: {
    // TODO(design-system): Figma node 732:17470은 Bold지만 현재 번들에는 Semibold까지만 있다.
    fontVariant: ['tabular-nums'],
  },
  list: {
    gap: 11,
  },
  emptyText: {
    minHeight: 44,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  feedback: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  feedbackMessage: {
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 88,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  detailsText: {
    color: '#5C5E63',
  },
  pressed: { opacity: 0.65 },
});
