import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { mockHandoffRepository } from '@/features/handoffs/api/mockHandoffRepository';
import { DeleteHandoffDialog } from '@/features/handoffs/components/DeleteHandoffDialog';
import { HandoffActionSheet } from '@/features/handoffs/components/HandoffActionSheet';
import { HandoffScopeTabs } from '@/features/handoffs/components/HandoffScopeTabs';
import { HandoffListContent } from '@/features/handoffs/components/handoff-list-content';
import type { HandoffScope } from '@/features/handoffs/model/handoff';
import { MainHeader, Pressable, QueryBoundary, Text } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing, useTheme } from '@/theme';

type HandoffListScreenProps = {
  scope: HandoffScope;
  onCreate: () => void;
  onEdit: (handoffId: string) => void;
  onNotificationPress: () => void;
  onOpen: (handoffId: string) => void;
  onScopeChange: (scope: HandoffScope) => void;
};

export function HandoffListScreen({
  scope,
  onCreate,
  onEdit,
  onNotificationPress,
  onOpen,
  onScopeChange,
}: HandoffListScreenProps) {
  const queryClient = useQueryClient();
  const theme = useTheme();
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

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.surfaceSunken }]}>
      <MainHeader model={HANDOFF_HEADER_MODEL} onNotificationPress={onNotificationPress} />

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

      <View style={styles.listRegion}>
        <QueryBoundary resetKey={scope}>
          <HandoffListContent scope={scope} onManagePress={handleManagePress} onOpen={onOpen} />
        </QueryBoundary>
      </View>

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

// TODO(api): 전역 매장 컨텍스트가 연결되면 홈과 같은 응답 모델에서 이 값을 공급한다.
const HANDOFF_HEADER_MODEL = {
  badgeText: '3',
  roleLabel: '관리자',
  storeLabel: '카페 바톤 강남점',
} as const;

const styles = StyleSheet.create({
  root: { flex: 1 },
  listRegion: { flex: 1 },
  toolbar: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  writeButton: {
    minWidth: 54,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
