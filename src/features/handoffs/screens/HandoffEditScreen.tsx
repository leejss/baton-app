import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useSuspenseQueries } from '@tanstack/react-query';
import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getHandoffTypeLabel, toLocalAttachments } from '@/features/handoffs/api/handoff.mappers';
import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { mockHandoffRepository } from '@/features/handoffs/api/mockHandoffRepository';
import { HandoffAttachmentStrip } from '@/features/handoffs/components/HandoffAttachmentStrip';
import { HandoffEditorFields } from '@/features/handoffs/components/HandoffEditorFields';
import { HandoffFooterActions } from '@/features/handoffs/components/HandoffFooterActions';
import { HandoffHeader } from '@/features/handoffs/components/HandoffHeader';
import { HandoffRecipientCard } from '@/features/handoffs/components/HandoffRecipientCard';
import { HandoffRecipientPickerModal } from '@/features/handoffs/components/HandoffRecipientPickerModal';
import type { LocalAttachment, RecipientModel } from '@/features/handoffs/model/handoff';
import {
  handoffContentFormSchema,
  type HandoffContentFormValues,
} from '@/features/handoffs/model/handoffForm';
import { useHandoffImagePicker } from '@/features/handoffs/model/useHandoffImagePicker';
import { useUnsavedHandoffGuard } from '@/features/handoffs/model/useUnsavedHandoffGuard';
import { Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

type HandoffEditScreenProps = {
  handoffId: string;
  onBack: () => void;
  onSaved: () => void;
};

export function HandoffEditScreen({ handoffId, onBack, onSaved }: HandoffEditScreenProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [{ data: handoff }, { data: recipients }] = useSuspenseQueries({
    queries: [handoffQueries.detail(handoffId), handoffQueries.recipients()],
  });
  const [recipient, setRecipient] = useState(handoff.recipient.user);
  const [attachments, setAttachments] = useState<LocalAttachment[]>(() =>
    toLocalAttachments(handoff.attachments),
  );
  const [recipientPickerVisible, setRecipientPickerVisible] = useState(false);
  const [pickerSelectedId, setPickerSelectedId] = useState<string | null>(recipient.userId);

  const { control, formState, handleSubmit } = useForm<HandoffContentFormValues>({
    defaultValues: { title: handoff.title, body: handoff.body },
    mode: 'onChange',
    resolver: zodResolver(handoffContentFormSchema),
  });
  const titleController = useController({ control, name: 'title' });
  const bodyController = useController({ control, name: 'body' });
  const hasChanges =
    formState.isDirty ||
    recipient.userId !== handoff.recipient.user.userId ||
    attachments.map(({ attachmentId }) => attachmentId).join(',') !==
      handoff.attachments.map(({ id }) => id).join(',');
  const handleSelectedImages = (selected: LocalAttachment[]) => {
    setAttachments((current) => [...current, ...selected].slice(0, 10));
  };
  const { addImages, isPickingImages } = useHandoffImagePicker({
    attachmentCount: attachments.length,
    onSelected: handleSelectedImages,
  });

  const updateMutation = useMutation({
    mutationFn: (values: HandoffContentFormValues) =>
      mockHandoffRepository.update(handoffId, {
        title: values.title.trim(),
        body: values.body.trim(),
        recipientId: recipient.userId,
        attachmentIds: attachments
          .map(({ attachmentId }) => attachmentId)
          .filter((id): id is string => id !== undefined),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: handoffQueries.all() });
      onSaved();
    },
    onError: (error) => {
      Alert.alert(
        '수정하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    },
  });

  const handleBack = useUnsavedHandoffGuard({
    hasChanges,
    continueLabel: '계속 수정',
    title: '수정을 그만할까요?',
    message: '변경한 내용은 저장되지 않아요.',
    onLeave: onBack,
  });

  const handleRemoveAttachment = (localId: string) => {
    setAttachments((current) => current.filter((item) => item.localId !== localId));
  };
  const handleOpenRecipientPicker = () => {
    setPickerSelectedId(recipient.userId);
    setRecipientPickerVisible(true);
  };
  const handleSelectRecipient = (item: RecipientModel) => setPickerSelectedId(item.member.userId);
  const handleConfirmRecipient = () => {
    const selected = recipients.find(({ member }) => member.userId === pickerSelectedId);
    if (selected === undefined) return;
    setRecipient(selected.member);
    setRecipientPickerVisible(false);
  };
  const submit = handleSubmit((values) => updateMutation.mutate(values));

  return (
    <View
      style={[styles.root, { backgroundColor: theme.colors.surfaceSunken, paddingTop: insets.top }]}
    >
      <HandoffHeader title="인수인계 수정" onLeadingPress={handleBack} />
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        <View style={styles.heading}>
          <Text variant="heading" weight="semibold">
            전달할 내용을 수정해 주세요
          </Text>
          <Text variant="bodySmall" color="textSecondary">
            {getHandoffTypeLabel(handoff.type)} · 유형은 변경할 수 없어요
          </Text>
        </View>
        <HandoffEditorFields
          title={titleController.field.value}
          body={bodyController.field.value}
          titleError={titleController.fieldState.error?.message}
          bodyError={bodyController.fieldState.error?.message}
          onBlurTitle={titleController.field.onBlur}
          onBlurBody={bodyController.field.onBlur}
          onChangeTitle={titleController.field.onChange}
          onChangeBody={bodyController.field.onChange}
        />
        <View style={styles.section}>
          <Text weight="semibold">사진</Text>
          <HandoffAttachmentStrip
            attachments={attachments}
            isPicking={isPickingImages}
            onAdd={addImages}
            onRemove={handleRemoveAttachment}
          />
        </View>
        <View style={styles.section}>
          <Text weight="semibold">받는 사람</Text>
          <HandoffRecipientCard
            recipient={recipient}
            isRecommended={recipients.some(
              (item) => item.isRecommended && item.member.userId === recipient.userId,
            )}
            onPress={handleOpenRecipientPicker}
          />
        </View>
      </ScrollView>
      <HandoffFooterActions
        secondaryLabel="취소"
        primaryLabel="저장"
        primaryDisabled={!formState.isValid || !hasChanges}
        primaryLoading={updateMutation.isPending}
        onPrimaryPress={() => void submit()}
        onSecondaryPress={handleBack}
      />
      <HandoffRecipientPickerModal
        recipients={recipients}
        selectedId={pickerSelectedId}
        visible={recipientPickerVisible}
        onClose={() => setRecipientPickerVisible(false)}
        onConfirm={handleConfirmRecipient}
        onSelect={handleSelectRecipient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    // TODO(design-system): 수정 화면의 18px 좌우 여백을 레이아웃 토큰으로 동기화한다.
  },
  heading: { gap: spacing.xs },
  section: { gap: spacing.sm },
});
