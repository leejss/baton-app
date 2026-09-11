import { normalizeError } from "@/shared/api/errors";
import { useAttachmentUploads } from "@/features/handoffs/hooks/useAttachmentUploads";
import { useMainContext } from "@/features/stores/hooks/useMainContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useController, useForm } from "react-hook-form";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useShallow } from "zustand/react/shallow";

import { toCreateRequest } from "@/features/handoffs/api/mappers";
import { handoffQueries } from "@/features/handoffs/api/handoff.queries";
import { handoffMutations } from "@/features/handoffs/api/handoff.mutations";
import { HandoffAttachmentStrip } from "@/features/handoffs/components/HandoffAttachmentStrip";
import { HandoffEditorFields } from "@/features/handoffs/components/HandoffEditorFields";
import { HandoffFooterActions } from "@/features/handoffs/components/HandoffFooterActions";
import { HandoffRecipientCard } from "@/features/handoffs/components/HandoffRecipientCard";
import {
  handoffContentFormSchema,
  type HandoffContentFormValues,
} from "@/features/handoffs/lib/handoffForm";
import { useHandoffDraftStore } from "@/features/handoffs/store/handoffDraftStore";
import { useHandoffImagePicker } from "@/features/handoffs/hooks/useHandoffImagePicker";
import { ScreenHeader } from "@/shared/ui/ScreenHeader";
import { Button, Text } from "@/shared/ui";
import { SCREEN_PADDING_X, useTheme } from "@/theme";

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
  const queryClient = useQueryClient();
  const context = useMainContext();
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
    updateAttachment,
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
      updateAttachment: state.updateAttachment,
      reset: state.reset,
    })),
  );

  const { control, getValues, handleSubmit } =
    useForm<HandoffContentFormValues>({
      defaultValues: { title, body },
      mode: "onChange",
      resolver: zodResolver(handoffContentFormSchema),
    });
  const titleController = useController({ control, name: "title" });
  const bodyController = useController({ control, name: "body" });
  const uploads = useAttachmentUploads({
    attachments,
    onAdd: addAttachments,
    onUpdate: updateAttachment,
    onRemove: removeAttachment,
  });
  const { addImages, isPickingImages } = useHandoffImagePicker({
    attachmentCount: attachments.length,
    onSelected: uploads.add,
  });
  const recipientsQuery = useQuery(
    handoffQueries.recipients(context.storeId, context.userId),
  );
  // 추천값은 화면 기본 선택으로만 사용하고, 사용자가 고른 값만 작성 상태에 저장한다.
  const effectiveRecipient =
    (recipient
      ? recipientsQuery.data?.find(
          (item) => item.member.userId === recipient.member.userId,
        )
      : recipientsQuery.data?.filter((item) => item.isRecommended).length === 1
        ? recipientsQuery.data.find((item) => item.isRecommended)
        : null) ?? null;

  const createMutation = useMutation(
    handoffMutations(queryClient, context.storeId).create(),
  );

  const handleTitleChange = (value: string) => {
    titleController.field.onChange(value);
    setContent(value, getValues("body"));
  };
  const handleBodyChange = (value: string) => {
    bodyController.field.onChange(value);
    setContent(getValues("title"), value);
  };

  const submit = handleSubmit((values) => {
    if (createMutation.isPending || !uploads.isReady || isPickingImages) return;
    if (type === null || effectiveRecipient === null) {
      Alert.alert(
        "전송할 수 없어요",
        "인수인계 유형과 받는 사람을 확인해 주세요.",
      );
      return;
    }

    setContent(values.title, values.body);
    createMutation.mutate(
      toCreateRequest({
        type,
        ...values,
        recipient: effectiveRecipient,
        attachments,
      }),
      {
        onSuccess: (created) => {
          reset();
          onSent(String(created.id));
        },
        onError: (error) =>
          Alert.alert("전송하지 못했어요", normalizeError(error).message),
      },
    );
  });

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        onBack={() => {
          if (!createMutation.isPending) onBack();
        }}
      />
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        <View style={styles.content}>
          {recipientsQuery.isError && (
            <>
              <Text color="dangerText">수신자 목록을 불러오지 못했습니다.</Text>
              <Button
                label="수신자 다시 조회"
                onPress={() => void recipientsQuery.refetch()}
              />
            </>
          )}
          <View style={styles.mainSection}>
            <Text variant="subheading" weight="semibold" style={styles.heading}>
              어떤 내용을 전달해야하나요?
            </Text>

            <HandoffEditorFields
              disabled={createMutation.isPending}
              title={titleController.field.value}
              body={bodyController.field.value}
              titleError={titleController.fieldState.error?.message}
              bodyError={bodyController.fieldState.error?.message}
              onBlurTitle={titleController.field.onBlur}
              onBlurBody={bodyController.field.onBlur}
              onChangeTitle={handleTitleChange}
              onChangeBody={handleBodyChange}
            />

            <HandoffAttachmentStrip
              attachments={attachments}
              isPicking={isPickingImages || createMutation.isPending}
              onAdd={addImages}
              onRemove={uploads.remove}
              onRetry={uploads.retry}
            />
          </View>

          <View style={styles.recipientSection}>
            <Text
              variant="bodySmall"
              weight="semibold"
              style={styles.sectionLabel}
            >
              받는 사람
            </Text>
            <HandoffRecipientCard
              recipient={effectiveRecipient?.member ?? null}
              isRecommended={effectiveRecipient?.isRecommended}
              onPress={() => {
                if (!createMutation.isPending) onRecipientPress();
              }}
            />
          </View>
        </View>
      </ScrollView>
      <HandoffFooterActions
        secondaryLabel="이전"
        primaryLabel="이대로 보내기"
        primaryDisabled={
          !uploads.isReady ||
          isPickingImages ||
          effectiveRecipient === null ||
          type === null
        }
        primaryLoading={createMutation.isPending}
        primaryTone="accent"
        onPrimaryPress={() => void submit()}
        onSecondaryPress={onBack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: 28,
    paddingBottom: 32,
  },
  content: { width: "100%", gap: 32 },
  mainSection: { gap: 20 },
  recipientSection: { gap: 11 },
  // TODO(design-system): Figma 732:21494의 foreground/strong·subtle 색상을 시맨틱 컬러에 추가한다.
  heading: { color: "#1F2937" },
  sectionLabel: { color: "#9CA3AF" },
  // TODO(design-system): 작성 화면의 28/32/20/11px 간격을 레이아웃 토큰으로 동기화한다.
});
