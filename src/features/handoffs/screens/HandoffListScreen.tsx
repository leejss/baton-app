import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { mockHandoffRepository } from '@/features/handoffs/api/mockHandoffRepository';
import { DeleteHandoffDialog } from '@/features/handoffs/components/DeleteHandoffDialog';
import {
  HandoffActionSheet,
  type HandoffActionSheetMethods,
} from '@/features/handoffs/components/HandoffActionSheet';
import { HandoffScopeTabs } from '@/features/handoffs/components/HandoffScopeTabs';
import { HandoffListContent } from '@/features/handoffs/components/handoff-list-content';
import type { HandoffScope } from '@/features/handoffs/model/handoff';
import { Pressable, QueryBoundary, Text } from '@/shared/ui';
import { MainHeader } from '@/features/tabs/components/MainHeader';
import { SCREEN_PADDING_X, spacing, useTheme } from '@/theme';

type HandoffListScreenProps = {
  scope: HandoffScope;
  onCreate: () => void;
  onEdit: (handoffId: string) => void;
  onOpen: (handoffId: string) => void;
  onScopeChange: (scope: HandoffScope) => void;
};

export function HandoffListScreen({
  scope,
  onCreate,
  onEdit,
  onOpen,
  onScopeChange,
}: HandoffListScreenProps) {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const actionSheetRef = useRef<HandoffActionSheetMethods>(null);
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

  const handleManagePress = (handoffId: string) => {
    setManagedId(handoffId);
    actionSheetRef.current?.present();
  };
  const handleCloseSheet = () => setManagedId(null);
  const handleEdit = () => {
    if (managedId === null) return;
    onEdit(managedId);
  };
  const handleDelete = () => {
    if (managedId === null) return;
    setDeleteId(managedId);
  };
  const handleCancelDelete = () => setDeleteId(null);
  const handleConfirmDelete = () => {
    if (deleteId !== null) deleteMutation.mutate(deleteId);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.surfaceSunken }]}>
      <MainHeader title="인수인계" />

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
        ref={actionSheetRef}
        onDismiss={handleCloseSheet}
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
