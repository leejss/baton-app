import { normalizeError } from '@/shared/api/errors';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { handoffMutations } from '@/features/handoffs/api/handoff.mutations';
import { DeleteHandoffDialog } from '@/features/handoffs/components/DeleteHandoffDialog';
import {
  HandoffActionSheet,
  type HandoffActionSheetMethods,
} from '@/features/handoffs/components/HandoffActionSheet';
import { HandoffScopeTabs } from '@/features/handoffs/components/HandoffScopeTabs';
import { HandoffListContent } from '@/features/handoffs/components/HandoffListContent';
import type { HandoffScope } from '@/features/handoffs/types';
import { QueryBoundary } from '@/shared/ui';
import { MainHeader } from '@/features/tabs/components/MainHeader';
import { SCREEN_PADDING_X, spacing, useTheme } from '@/theme';

type HandoffListScreenProps = {
  scope: HandoffScope;
  onEdit: (handoffId: string) => void;
  onOpen: (handoffId: string) => void;
  onScopeChange: (scope: HandoffScope) => void;
};

export function HandoffListScreen({
  scope,
  onEdit,
  onOpen,
  onScopeChange,
}: HandoffListScreenProps) {
  const queryClient = useQueryClient();
  const context = useMainContext();
  const theme = useTheme();
  const actionSheetRef = useRef<HandoffActionSheetMethods>(null);
  const [managedId, setManagedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteMutation = useMutation(handoffMutations(queryClient, context.workspaceId).remove());

  const handleManagePress = (handoffId: string) => {
    void queryClient
      .fetchQuery({
        ...handoffQueries.detail(context.workspaceId, handoffId),
        staleTime: 0,
      })
      .then((item) => {
        if (item.sender.userId !== context.userId || item.status !== 'UNCONFIRMED') {
          Alert.alert('수정·삭제할 수 없는 인수인계입니다.');
          return;
        }
        setManagedId(handoffId);
        actionSheetRef.current?.present();
      })
      .catch((error) => Alert.alert('항목을 확인하지 못했어요', normalizeError(error).message));
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
    if (deleteId !== null && !deleteMutation.isPending)
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
        onError: (error) => {
          setDeleteId(null);
          Alert.alert('삭제하지 못했어요', normalizeError(error).message);
        },
      });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.surfaceNeutralSubtle }]}>
      <MainHeader title="인수인계" backgroundColor={theme.colors.surfaceNeutralSubtle} />

      <View style={styles.toolbar}>
        <HandoffScopeTabs value={scope} onChange={onScopeChange} />
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
    paddingTop: 20,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
