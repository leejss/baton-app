import { ErrorState } from '@/shared/ui/ErrorState';
import { QueryRefreshNotice } from '@/shared/ui/QueryRefreshNotice';
import { normalizeError, isAppError } from '@/shared/api/errors';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { toHandoffDetailModel } from '@/features/handoffs/api/mappers';
import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { handoffMutations } from '@/features/handoffs/api/handoff.mutations';
import { DeleteHandoffDialog } from '@/features/handoffs/components/DeleteHandoffDialog';
import {
  HandoffActionSheet,
  type HandoffActionSheetMethods,
} from '@/features/handoffs/components/HandoffActionSheet';
import { HandoffDetailAttachments } from '@/features/handoffs/components/HandoffDetailAttachments';
import { HandoffDetailStatusBar } from '@/features/handoffs/components/HandoffDetailStatusBar';
import { HandoffTypeBadge } from '@/features/handoffs/components/HandoffTypeBadge';
import { KebabMenu } from '@/shared/ui/icons';
import { Pressable } from '@/shared/ui/Pressable';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { BottomActionBar, Button, QueryBoundary, Snackbar, Text } from '@/shared/ui';
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
  const queryClient = useQueryClient();
  const context = useMainContext();
  const theme = useTheme();
  const actionSheetRef = useRef<HandoffActionSheetMethods>(null);
  const detailQuery = useQuery(handoffQueries.detail(context.workspaceId, handoffId));
  const data = detailQuery.data;
  const accessError =
    isAppError(detailQuery.error) && [403, 404].includes(detailQuery.error.status ?? 0)
      ? detailQuery.error
      : null;
  const detail = data && !accessError ? toHandoffDetailModel(data, context.userId) : null;
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const deleteMutation = useMutation(handoffMutations(queryClient, context.workspaceId).remove());
  const confirmMutation = useMutation(handoffMutations(queryClient, context.workspaceId).confirm());
  const [confirmationComplete, setConfirmationComplete] = useState(false);

  const handleEdit = () => {
    onEdit();
  };
  const handleDelete = () => {
    setDeleteDialogVisible(true);
  };
  const handleManage = () => {
    actionSheetRef.current?.present();
  };
  const canConfirm =
    data !== undefined &&
    data.recipient.user.userId === context.userId &&
    data.status === 'UNCONFIRMED' &&
    !confirmationComplete;
  const confirmationNotice = confirmationComplete ? (
    <View pointerEvents="none" style={styles.confirmationNotice}>
      <Snackbar tone="success" title="확인 완료했습니다." />
    </View>
  ) : undefined;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.backgroundDefault }]}>
      <ScreenHeader
        onBack={onBack}
        onHome={onHome}
        right={
          detail?.canManage && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="인수인계 수정 및 삭제 메뉴"
              onPress={handleManage}
              style={styles.manageButton}
            >
              <KebabMenu size={13.8} color="foregroundStrong" />
            </Pressable>
          )
        }
      />

      <QueryBoundary query={detailQuery} resetKey={handoffId}>
        {accessError ? (
          <ErrorState error={accessError} />
        ) : data && detail ? (
          <>
            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
            >
              <QueryRefreshNotice
                failed={detailQuery.isRefetchError}
                onRetry={() => void detailQuery.refetch()}
              />
              <HandoffTypeBadge label={detail.typeLabel} type={detail.type} />

              <View style={styles.article}>
                <View style={styles.headingSection}>
                  <View style={styles.headingCopy}>
                    <Text
                      variant="subheading"
                      weight="semibold"
                      color="foregroundStrong"
                      selectable
                    >
                      {detail.title}
                    </Text>
                    <View style={styles.meta}>
                      <Text variant="caption" weight="medium" color="foregroundSubtle" selectable>
                        {detail.dateLabel}
                      </Text>
                      <Text variant="caption" weight="medium" color="foregroundSubtle">
                        ∙
                      </Text>
                      <Text variant="caption" weight="medium" color="foregroundSubtle" selectable>
                        {detail.participantLabel}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.divider, { backgroundColor: theme.colors.borderDefault }]} />
                </View>

                <View style={styles.bodyCopy}>
                  {detail.body.split('\n').map((paragraph, index) => (
                    <Text key={index} weight="regular" color="foregroundDefault" selectable>
                      {paragraph}
                    </Text>
                  ))}
                </View>

                <View style={[styles.divider, { backgroundColor: theme.colors.borderDefault }]} />
              </View>

              <HandoffDetailAttachments
                attachments={detail.attachments}
                onRefresh={() => detailQuery.refetch()}
              />
            </ScrollView>

            {canConfirm ? (
              <BottomActionBar>
                <Button
                  label="확인 하기"
                  isLoading={confirmMutation.isPending}
                  onPress={() => {
                    if (!confirmMutation.isPending)
                      confirmMutation.mutate(data.id, {
                        onSuccess: () => setConfirmationComplete(true),
                        onError: (error) =>
                          Alert.alert('확인하지 못했어요', normalizeError(error).message),
                      });
                  }}
                />
              </BottomActionBar>
            ) : (
              <HandoffDetailStatusBar
                label={confirmationComplete ? '확인 완료' : detail.statusActionLabel}
                above={confirmationNotice}
              />
            )}
            <HandoffActionSheet ref={actionSheetRef} onDelete={handleDelete} onEdit={handleEdit} />
            <DeleteHandoffDialog
              isDeleting={deleteMutation.isPending}
              visible={deleteDialogVisible}
              onCancel={() => setDeleteDialogVisible(false)}
              onConfirm={() => {
                if (!deleteMutation.isPending)
                  deleteMutation.mutate(handoffId, {
                    onSuccess: onDeleted,
                    onError: (error) => {
                      setDeleteDialogVisible(false);
                      Alert.alert('삭제하지 못했어요', normalizeError(error).message, [
                        {
                          text: '확인',
                          onPress: () => {
                            if (isAppError(error) && error.status === 404) onDeleted();
                          },
                        },
                      ]);
                    },
                  });
              }}
            />
          </>
        ) : null}
      </QueryBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  manageButton: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  confirmationNotice: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: 14,
    marginBottom: 4,
  },
});
