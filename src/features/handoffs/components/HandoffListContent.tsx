import { toHandoffCardModel } from "@/features/handoffs/api/mappers";
import { useMainContext } from "@/features/stores/hooks/useMainContext";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { StyleSheet, View } from "react-native";

import { handoffQueries } from "@/features/handoffs/api/handoff.queries";
import { HandoffCard } from "@/features/handoffs/components/HandoffCard";
import type { HandoffCardModel, HandoffScope } from "@/features/handoffs/types";
import { Button, Text, EmptyState } from "@/shared/ui";
import { SCREEN_PADDING_X, spacing } from "@/theme";

type HandoffListContentProps = {
  scope: HandoffScope;
  onManagePress: (handoffId: string) => void;
  onOpen: (handoffId: string) => void;
};

/** 탭별 서버 데이터만 이 컴포넌트에서 중단시켜 화면의 고정 영역은 계속 유지한다. */
export function HandoffListContent({
  scope,
  onManagePress,
  onOpen,
}: HandoffListContentProps) {
  const context = useMainContext();
  const query = useSuspenseInfiniteQuery(
    handoffQueries.list(context.storeId, context.userId, scope),
  );

  const items = query.data.pages
    .flatMap((page) => page.items)
    .map((item) => toHandoffCardModel(item, context.userId, new Date(), scope));
  const renderItem: ListRenderItem<HandoffCardModel> = ({ item }) => (
    <HandoffCard item={item} onPress={onOpen} onManagePress={onManagePress} />
  );

  return (
    <FlashList
      data={items}
      onEndReached={() => {
        if (
          query.hasNextPage &&
          !query.isFetching &&
          !query.isFetchNextPageError
        )
          void query.fetchNextPage();
      }}
      onEndReachedThreshold={0.4}
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => void query.refetch()}
      ListFooterComponent={
        query.isFetchNextPageError ? (
          <Button
            label="추가 목록 다시 조회"
            onPress={() => void query.fetchNextPage()}
          />
        ) : query.isFetchingNextPage ? (
          <Text>더 불러오는 중입니다.</Text>
        ) : query.isRefetchError ? (
          <Button
            label="목록 새로고침 재시도"
            onPress={() => void query.refetch()}
          />
        ) : null
      }
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.listContent}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparator}
      ListEmptyComponent={
        <EmptyState
          title="인수인계가 없어요"
          description="새 인수인계를 작성해 보세요."
        />
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
