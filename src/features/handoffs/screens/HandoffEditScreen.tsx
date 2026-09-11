import { ErrorState } from "@/shared/ui/ErrorState";
import { normalizeError, isAppError } from "@/shared/api/errors";
import { useAttachmentUploads } from "@/features/handoffs/hooks/useAttachmentUploads";
import { useMainContext } from "@/features/stores/hooks/useMainContext";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  useSuspenseQueries,
} from "@tanstack/react-query";
import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import {
  getHandoffTypeLabel,
  toLocalAttachments,
} from "@/features/handoffs/api/mappers";
import { handoffQueries } from "@/features/handoffs/api/handoff.queries";
import { handoffMutations } from "@/features/handoffs/api/handoff.mutations";
import { HandoffAttachmentStrip } from "@/features/handoffs/components/HandoffAttachmentStrip";
import { HandoffEditorFields } from "@/features/handoffs/components/HandoffEditorFields";
import { HandoffFooterActions } from "@/features/handoffs/components/HandoffFooterActions";
import { HandoffRecipientCard } from "@/features/handoffs/components/HandoffRecipientCard";
import { HandoffRecipientPickerModal } from "@/features/handoffs/components/HandoffRecipientPickerModal";
import type {
  LocalAttachment,
  RecipientModel,
} from "@/features/handoffs/types";
import {
  handoffContentFormSchema,
  type HandoffContentFormValues,
} from "@/features/handoffs/lib/handoffForm";
import { useHandoffImagePicker } from "@/features/handoffs/hooks/useHandoffImagePicker";
import { useUnsavedHandoffGuard } from "@/features/handoffs/hooks/useUnsavedHandoffGuard";
import { ScreenHeader } from "@/shared/ui/ScreenHeader";
import { Text } from "@/shared/ui";
import { spacing, useTheme } from "@/theme";

type HandoffEditScreenProps = {
  handoffId: string;
  onBack: () => void;
  onSaved: () => void;
};

export function HandoffEditScreen({
  handoffId,
  onBack,
  onSaved,
}: HandoffEditScreenProps) {
  const queryClient = useQueryClient();
  const context = useMainContext();
  const theme = useTheme();
  const [detailQuery, recipientsQuery] = useSuspenseQueries({
    queries: [
      handoffQueries.detail(context.storeId, handoffId),
      handoffQueries.recipients(context.storeId, context.userId),
    ],
  });
  const handoff = detailQuery.data;
  const recipients = recipientsQuery.data;
  const [recipient, setRecipient] = useState(handoff.recipient.user);
  const [attachments, setAttachments] = useState<LocalAttachment[]>(() =>
    toLocalAttachments(handoff.attachments),
  );
  const [recipientPickerVisible, setRecipientPickerVisible] = useState(false);
  const [pickerSelectedId, setPickerSelectedId] = useState<number | null>(
    recipient.userId,
  );

  const { control, formState, handleSubmit } =
    useForm<HandoffContentFormValues>({
      defaultValues: { title: handoff.title, body: handoff.body },
      mode: "onChange",
      resolver: zodResolver(handoffContentFormSchema),
    });
  const titleController = useController({ control, name: "title" });
  const bodyController = useController({ control, name: "body" });
  const hasChanges =
    formState.isDirty ||
    recipient.userId !== handoff.recipient.user.userId ||
    attachments.map(({ attachmentId }) => attachmentId).join(",") !==
      handoff.attachments.map(({ id }) => id).join(",");
  const handleSelectedImages = (selected: LocalAttachment[]) => {
    setAttachments((current) => [...current, ...selected].slice(0, 10));
  };
  const uploads = useAttachmentUploads({
    attachments,
    onAdd: handleSelectedImages,
    onUpdate: (id, patch) =>
      setAttachments((current) =>
        current.map((item) =>
          item.localId === id ? { ...item, ...patch } : item,
        ),
      ),
    onRemove: (id) =>
      setAttachments((current) =>
        current.filter((item) => item.localId !== id),
      ),
  });
  const { addImages, isPickingImages } = useHandoffImagePicker({
    attachmentCount: attachments.length,
    onSelected: uploads.add,
  });

  const updateMutation = useMutation(
    handoffMutations(queryClient, context.storeId).update(handoffId),
  );

  const handleBack = useUnsavedHandoffGuard({
    hasChanges,
    isBusy: updateMutation.isPending,
    continueLabel: "계속 수정",
    title: "수정을 그만할까요?",
    message: "변경한 내용은 저장되지 않아요.",
    onLeave: onBack,
  });

  const handleOpenRecipientPicker = () => {
    setPickerSelectedId(recipient.userId);
    setRecipientPickerVisible(true);
  };
  const handleSelectRecipient = (item: RecipientModel) =>
    setPickerSelectedId(item.member.userId);
  const handleConfirmRecipient = () => {
    const selected = recipients.find(
      ({ member }) => member.userId === pickerSelectedId,
    );
    if (selected === undefined) return;
    setRecipient(selected.member);
    setRecipientPickerVisible(false);
  };
  const submit = handleSubmit((values) => {
    if (
      updateMutation.isPending ||
      !uploads.isReady ||
      isPickingImages ||
      handoff.status !== "UNCONFIRMED" ||
      handoff.sender.userId !== context.userId
    )
      return;
    updateMutation.mutate(
      {
        ...values,
        recipientId: recipient.userId,
        attachmentIds: attachments.flatMap((item) =>
          item.attachmentId === undefined ? [] : [item.attachmentId],
        ),
      },
      {
        onSuccess: onSaved,
        onError: (error) => {
          Alert.alert("수정하지 못했어요", normalizeError(error).message, [
            {
              text: "확인",
              onPress: () => {
                if (
                  isAppError(error) &&
                  [403, 404, 409].includes(error.status ?? 0)
                )
                  onBack();
              },
            },
          ]);
        },
      },
    );
  });

  if (
    isAppError(detailQuery.error) &&
    [403, 404].includes(detailQuery.error.status ?? 0)
  )
    return <ErrorState error={detailQuery.error} onBack={onBack} />;
  return (
    <View
      style={[styles.root, { backgroundColor: theme.colors.surfaceSunken }]}
    >
      <ScreenHeader
        title="인수인계 수정"
        onBack={() => {
          if (!updateMutation.isPending) handleBack();
        }}
      />
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        {(handoff.status !== "UNCONFIRMED" ||
          handoff.sender.userId !== context.userId) && (
          <Text color="dangerText">
            수정할 수 없는 인수인계입니다. 이전 화면으로 돌아가 최신 상태를
            확인해주세요.
          </Text>
        )}
        <View style={styles.heading}>
          <Text variant="heading" weight="semibold">
            전달할 내용을 수정해 주세요
          </Text>
          <Text variant="bodySmall" color="textSecondary">
            {getHandoffTypeLabel(handoff.type)} · 유형은 변경할 수 없어요
          </Text>
        </View>
        <HandoffEditorFields
          disabled={updateMutation.isPending}
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
            isPicking={isPickingImages || updateMutation.isPending}
            onAdd={addImages}
            onRemove={uploads.remove}
            onRetry={uploads.retry}
          />
        </View>
        <View style={styles.section}>
          <Text weight="semibold">받는 사람</Text>
          <HandoffRecipientCard
            recipient={recipient}
            isRecommended={recipients.some(
              (item) =>
                item.isRecommended && item.member.userId === recipient.userId,
            )}
            onPress={handleOpenRecipientPicker}
          />
        </View>
      </ScrollView>
      <HandoffFooterActions
        secondaryLabel="취소"
        primaryLabel="저장"
        primaryDisabled={
          !uploads.isReady ||
          isPickingImages ||
          !formState.isValid ||
          !hasChanges ||
          handoff.status !== "UNCONFIRMED" ||
          handoff.sender.userId !== context.userId ||
          !recipients.some((item) => item.member.userId === recipient.userId)
        }
        primaryLoading={updateMutation.isPending}
        onPrimaryPress={() => void submit()}
        onSecondaryPress={() => {
          if (!updateMutation.isPending) handleBack();
        }}
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
