import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useController, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { getHandoffTypeLabel, toCreateRequest } from '@/features/handoffs/api/handoff.mappers';
import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { mockHandoffRepository } from '@/features/handoffs/api/mockHandoffRepository';
import { HandoffAttachmentStrip } from '@/features/handoffs/components/HandoffAttachmentStrip';
import { HandoffEditorFields } from '@/features/handoffs/components/HandoffEditorFields';
import { HandoffFooterActions } from '@/features/handoffs/components/HandoffFooterActions';
import { HandoffHeader } from '@/features/handoffs/components/HandoffHeader';
import { HandoffRecipientCard } from '@/features/handoffs/components/HandoffRecipientCard';
import {
  handoffContentFormSchema,
  type HandoffContentFormValues,
} from '@/features/handoffs/model/handoffForm';
import { useHandoffDraftStore } from '@/features/handoffs/model/handoffDraftStore';
import { useHandoffImagePicker } from '@/features/handoffs/model/useHandoffImagePicker';
import { Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

type HandoffContentScreenProps = {
  onBack: () => void;
  onRecipientPress: () => void;
  onSent: (handoffId: string) => void;
};

export function HandoffContentScreen({
  onBack,
  onRecipientPress,
  onSent,
}: HandoffContentScreenProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const {
    type,
    title,
    body,
    recipient,
    attachments,
    setContent,
    addAttachments,
    removeAttachment,
    reset,
  } = useHandoffDraftStore(
    useShallow((state) => ({
      type: state.type,
      title: state.title,
      body: state.body,
      recipient: state.recipient,
      attachments: state.attachments,
      setContent: state.setContent,
      addAttachments: state.addAttachments,
      removeAttachment: state.removeAttachment,
      reset: state.reset,
    })),
  );

  const { control, formState, getValues, handleSubmit } = useForm<HandoffContentFormValues>({
    defaultValues: { title, body },
    mode: 'onChange',
    resolver: zodResolver(handoffContentFormSchema),
  });
  const titleController = useController({ control, name: 'title' });
  const bodyController = useController({ control, name: 'body' });
  const { addImages, isPickingImages } = useHandoffImagePicker({
    attachmentCount: attachments.length,
    onSelected: addAttachments,
  });

  const createMutation = useMutation({
    mutationFn: mockHandoffRepository.create,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: handoffQueries.all() });
      reset();
      onSent(created.id);
    },
    onError: (error) => {
      Alert.alert(
        '전송하지 못했어요',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    },
  });

  const handleTitleChange = (value: string) => {
    titleController.field.onChange(value);
    setContent(value, getValues('body'));
  };
  const handleBodyChange = (value: string) => {
    bodyController.field.onChange(value);
    setContent(getValues('title'), value);
  };

  const submit = handleSubmit((values) => {
    setContent(values.title, values.body);
    createMutation.mutate(toCreateRequest({ type, ...values, recipient, attachments }));
  });

  return (
    <View
      style={[styles.root, { backgroundColor: theme.colors.surfaceSunken, paddingTop: insets.top }]}
    >
      <HandoffHeader onLeadingPress={onBack} />
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        <View style={styles.heading}>
          <Text variant="heading" weight="semibold">
            전달할 내용을{`\n`}작성해 주세요
          </Text>
          <Text variant="bodySmall" color="textSecondary">
            {type === null ? '유형 미선택' : getHandoffTypeLabel(type)}
          </Text>
        </View>

        <HandoffEditorFields
          title={titleController.field.value}
          body={bodyController.field.value}
          titleError={titleController.fieldState.error?.message}
          bodyError={bodyController.fieldState.error?.message}
          onBlurTitle={titleController.field.onBlur}
          onBlurBody={bodyController.field.onBlur}
          onChangeTitle={handleTitleChange}
          onChangeBody={handleBodyChange}
        />

        <View style={styles.section}>
          <Text weight="semibold">사진</Text>
          <HandoffAttachmentStrip
            attachments={attachments}
            isPicking={isPickingImages}
            onAdd={addImages}
            onRemove={removeAttachment}
          />
        </View>

        <View style={styles.section}>
          <Text weight="semibold">받는 사람</Text>
          <HandoffRecipientCard
            recipient={recipient?.member ?? null}
            isRecommended={recipient?.isRecommended}
            onPress={onRecipientPress}
          />
        </View>
      </ScrollView>
      <HandoffFooterActions
        secondaryLabel="이전"
        primaryLabel="전송"
        primaryDisabled={!formState.isValid || recipient === null || type === null}
        primaryLoading={createMutation.isPending}
        onPrimaryPress={() => void submit()}
        onSecondaryPress={onBack}
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
    // TODO(design-system): 작성 화면의 18px 좌우 여백을 레이아웃 토큰으로 동기화한다.
  },
  heading: { gap: spacing.xs },
  section: { gap: spacing.sm },
});
