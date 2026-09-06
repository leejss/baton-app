import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { mockHandoffRepository } from '@/features/handoffs/api/mockHandoffRepository';
import { DeleteHandoffDialog } from '@/features/handoffs/components/DeleteHandoffDialog';
import { HandoffActionSheet } from '@/features/handoffs/components/HandoffActionSheet';
import { HandoffCard } from '@/features/handoffs/components/HandoffCard';
import { HandoffHeader } from '@/features/handoffs/components/HandoffHeader';
import { HandoffScopeTabs } from '@/features/handoffs/components/HandoffScopeTabs';
import type { HandoffCardModel, HandoffScope } from '@/features/handoffs/model/handoff';
import { EmptyState, Pressable, Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

type HandoffListScreenProps = {
  scope: HandoffScope;
  onBack: () => void;
  onCreate: () => void;
  onEdit: (handoffId: string) => void;
  onNotificationPress: () => void;
  onOpen: (handoffId: string) => void;
  onScopeChange: (scope: HandoffScope) => void;
};

export function HandoffListScreen({
  scope,
  onBack,
  onCreate,
  onEdit,
  onNotificationPress,
  onOpen,
  onScopeChange,
}: HandoffListScreenProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { data } = useSuspenseQuery(handoffQueries.list(scope));
  const [managedId, setManagedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: mockHandoffRepository.delete,
    onSuccess: async () => {
      setDeleteId(null);
      await queryClient.invalidateQueries({ queryKey: handoffQueries.all() });
    },
    onError: (error) => {
      Alert.alert(
        '삭제하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    },
  });

  const handleManagePress = (handoffId: string) => setManagedId(handoffId);
  const handleCloseSheet = () => setManagedId(null);
  const handleEdit = () => {
    if (managedId === null) return;
    const handoffId = managedId;
    setManagedId(null);
    onEdit(handoffId);
  };
  const handleDelete = () => {
    if (managedId === null) return;
    setDeleteId(managedId);
    setManagedId(null);
  };
  const handleCancelDelete = () => setDeleteId(null);
  const handleConfirmDelete = () => {
    if (deleteId !== null) deleteMutation.mutate(deleteId);
  };

  const renderItem: ListRenderItem<HandoffCardModel> = ({ item }) => (
    <HandoffCard item={item} onPress={onOpen} onManagePress={handleManagePress} />
  );

  return (
    <View
      style={[styles.root, { backgroundColor: theme.colors.surfaceSunken, paddingTop: insets.top }]}
    >
      <HandoffHeader
        title="인수인계"
        storeName="바톤 강남점"
        onLeadingPress={onBack}
        onNotificationPress={onNotificationPress}
      />

      <View style={styles.toolbar}>
        <HandoffScopeTabs value={scope} onChange={onScopeChange} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="인수인계 글쓰기"
          onPress={onCreate}
          style={styles.writeButton}
        >
          <Text variant="bodySmall" weight="semibold">
            글쓰기
          </Text>
        </Pressable>
      </View>

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

      <HandoffActionSheet
        visible={managedId !== null}
        onClose={handleCloseSheet}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
      <DeleteHandoffDialog
        isDeleting={deleteMutation.isPending}
        visible={deleteId !== null}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}

function keyExtractor(item: HandoffCardModel) {
  return item.id;
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  toolbar: {
    paddingHorizontal: 18,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    // TODO(design-system): 목록의 18px 좌우 여백을 화면 레이아웃 토큰으로 동기화한다.
  },
  writeButton: {
    minWidth: 54,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: spacing.lg,
  },
  separator: { height: spacing.md },
});
