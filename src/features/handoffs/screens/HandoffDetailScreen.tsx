import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toHandoffDetailModel } from '@/features/handoffs/api/handoff.mappers';
import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { CURRENT_USER_ID } from '@/features/handoffs/api/mockHandoffData';
import { mockHandoffRepository } from '@/features/handoffs/api/mockHandoffRepository';
import { DeleteHandoffDialog } from '@/features/handoffs/components/DeleteHandoffDialog';
import {
  HandoffActionSheet,
  type HandoffActionSheetMethods,
} from '@/features/handoffs/components/HandoffActionSheet';
import { HandoffDetailAttachments } from '@/features/handoffs/components/HandoffDetailAttachments';
import { HandoffDetailHeader } from '@/features/handoffs/components/HandoffDetailHeader';
import { HandoffDetailStatusBar } from '@/features/handoffs/components/HandoffDetailStatusBar';
import { HandoffTypeBadge } from '@/features/handoffs/components/HandoffTypeBadge';
import { Text } from '@/shared/ui';
import { SCREEN_PADDING_X, useTheme } from '@/theme';

type HandoffDetailScreenProps = {
  handoffId: string;
  onBack: () => void;
  onDeleted: () => void;
  onEdit: () => void;
  onHome: () => void;
};

export function HandoffDetailScreen({
  handoffId,
  onBack,
  onDeleted,
  onEdit,
  onHome,
}: HandoffDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const actionSheetRef = useRef<HandoffActionSheetMethods>(null);
  const { data } = useSuspenseQuery(handoffQueries.detail(handoffId));
  const detail = toHandoffDetailModel(data, CURRENT_USER_ID);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => mockHandoffRepository.delete(handoffId),
    onSuccess: async () => {
      setDeleteDialogVisible(false);
      await queryClient.invalidateQueries({
        queryKey: handoffQueries.detail(handoffId).queryKey,
        refetchType: 'none',
      });
      await queryClient.invalidateQueries({ queryKey: [...handoffQueries.all(), 'list'] });
      onDeleted();
    },
    onError: (error) => {
      Alert.alert(
        '삭제하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    },
  });

  const handleEdit = () => {
    onEdit();
  };
  const handleDelete = () => {
    setDeleteDialogVisible(true);
  };
  const handleManage = () => {
    actionSheetRef.current?.present();
  };

  return (
    <View
      style={[styles.root, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}
    >
      <HandoffDetailHeader
        onBack={onBack}
        onHome={onHome}
        onManage={detail.canManage ? handleManage : undefined}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <HandoffTypeBadge label={detail.typeLabel} />

        <View style={styles.article}>
          <View style={styles.headingSection}>
            <View style={styles.headingCopy}>
              <Text variant="subheading" weight="semibold" selectable style={styles.title}>
                {detail.title}
              </Text>
              <View style={styles.meta}>
                <Text variant="caption" weight="medium" selectable style={styles.subtleText}>
                  {detail.dateLabel}
                </Text>
                <Text variant="caption" weight="medium" style={styles.subtleText}>
                  ∙
                </Text>
                <Text variant="caption" weight="medium" selectable style={styles.subtleText}>
                  {detail.recipientLabel}
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          </View>

          <View style={styles.bodyCopy}>
            {detail.body.split('\n').map((paragraph, index) => (
              <Text key={index} weight="regular" color="textSecondary" selectable>
                {paragraph}
              </Text>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        </View>

        <HandoffDetailAttachments attachments={detail.attachments} />
      </ScrollView>

      <HandoffDetailStatusBar label={detail.statusActionLabel} />
      <HandoffActionSheet ref={actionSheetRef} onDelete={handleDelete} onEdit={handleEdit} />
      <DeleteHandoffDialog
        isDeleting={deleteMutation.isPending}
        visible={deleteDialogVisible}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: 21,
    paddingBottom: 32,
    gap: 20,
    // TODO(design-system): Figma 732:22068의 21/20px 상세 레이아웃 간격을 토큰화한다.
  },
  article: { gap: 25 },
  headingSection: { gap: 20 },
  headingCopy: { gap: 10 },
  bodyCopy: { gap: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  divider: { width: '100%', height: StyleSheet.hairlineWidth },
  // TODO(design-system): foreground/strong·subtle가 시맨틱 컬러에 추가되면 원시값을 교체한다.
  title: { color: '#1F2937' },
  subtleText: { color: '#9CA3AF' },
});
