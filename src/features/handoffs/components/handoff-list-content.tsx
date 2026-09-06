import { useSuspenseQuery } from '@tanstack/react-query';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';

import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { HandoffCard } from '@/features/handoffs/components/HandoffCard';
import type { HandoffCardModel, HandoffScope } from '@/features/handoffs/model/handoff';
import { EmptyState } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing } from '@/theme';

type HandoffListContentProps = {
  scope: HandoffScope;
  onManagePress: (handoffId: string) => void;
  onOpen: (handoffId: string) => void;
};

/** 탭별 서버 데이터만 이 컴포넌트에서 중단시켜 화면의 고정 영역은 계속 유지한다. */
export function HandoffListContent({ scope, onManagePress, onOpen }: HandoffListContentProps) {
  const { data } = useSuspenseQuery(handoffQueries.list(scope));

  const renderItem: ListRenderItem<HandoffCardModel> = ({ item }) => (
    <HandoffCard item={item} onPress={onOpen} onManagePress={onManagePress} />
  );

  return (
    <FlashList
      data={data.items}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.listContent}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparator}
      ListEmptyComponent={
        <EmptyState title="인수인계가 없어요" description="새 인수인계를 작성해 보세요." />
      }
      renderItem={renderItem}
      style={styles.list}
    />
  );
}

function keyExtractor(item: HandoffCardModel) {
  return item.id;
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingBottom: spacing.lg,
  },
  separator: { height: spacing.md },
});
