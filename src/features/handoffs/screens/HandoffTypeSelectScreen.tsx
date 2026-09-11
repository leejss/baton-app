import { ScrollView, StyleSheet, View } from "react-native";

import type { HandoffTypeDto } from "@/features/handoffs/api/handoff.schema";
import { HandoffFooterActions } from "@/features/handoffs/components/HandoffFooterActions";
import { HandoffTypeOption } from "@/features/handoffs/components/HandoffTypeOption";
import { HandoffPresetRecipientNext } from "@/features/handoffs/components/HandoffPresetRecipientNext";
import {
  hasHandoffDraftChanges,
  useHandoffDraftStore,
} from "@/features/handoffs/store/handoffDraftStore";
import { useUnsavedHandoffGuard } from "@/features/handoffs/hooks/useUnsavedHandoffGuard";
import { ScreenHeader } from "@/shared/ui/ScreenHeader";
import { Text } from "@/shared/ui";
import { SCREEN_PADDING_X, useTheme } from "@/theme";

type HandoffTypeSelectScreenProps = {
  initialRecipientId?: string;
  onExit: () => void;
  onNext: () => void;
};

const OPTIONS: readonly {
  type: HandoffTypeDto;
  label: string;
  description: string;
}[] = [
  { type: "WORK_TASK", label: "업무 처리", description: "못 끝낸 일, 정산 등" },
  {
    type: "STORE_STATUS",
    label: "매장 상태",
    description: "장비 ∙ 기기, 재고 등",
  },
  { type: "OTHER", label: "기타", description: "고객, 특이사항 등" },
];
const DEFAULT_HANDOFF_TYPE: HandoffTypeDto = "WORK_TASK";

export function HandoffTypeSelectScreen({
  onExit,
  onNext,
  initialRecipientId,
}: HandoffTypeSelectScreenProps) {
  const theme = useTheme();
  const type = useHandoffDraftStore((state) => state.type);
  const hasChanges = useHandoffDraftStore(hasHandoffDraftChanges);
  const setType = useHandoffDraftStore((state) => state.setType);
  const reset = useHandoffDraftStore((state) => state.reset);
  // 시안의 기본 선택은 표시 단계에서만 파생하고, 다음 단계로 갈 때 초안에 확정한다.
  const selectedType = type ?? DEFAULT_HANDOFF_TYPE;
  const handleExit = useUnsavedHandoffGuard({
    hasChanges,
    title: "작성을 그만할까요?",
    message: "작성 중인 내용은 저장되지 않아요.",
    onDiscard: reset,
    onLeave: onExit,
  });
  const handleNext = () => {
    if (type === null) setType(DEFAULT_HANDOFF_TYPE);
    onNext();
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader onClose={handleExit} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        <Text variant="subheading" weight="semibold" style={styles.heading}>
          어떤 내용을 전달해야하나요?
        </Text>
        <View style={styles.options}>
          {OPTIONS.map((option) => (
            <HandoffTypeOption
              key={option.type}
              {...option}
              selected={selectedType === option.type}
              onSelect={setType}
            />
          ))}
        </View>
      </ScrollView>
      {initialRecipientId ? (
        <HandoffPresetRecipientNext
          recipientId={initialRecipientId}
          onNext={handleNext}
        />
      ) : (
        <HandoffFooterActions primaryLabel="다음" onPrimaryPress={handleNext} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 20,
    // TODO(design-system): Figma 732:21450의 28/20px 간격을 레이아웃 토큰으로 동기화한다.
  },
  options: { gap: 16 },
  // TODO(design-system): foreground/strong가 시맨틱 컬러에 추가되면 원시값을 교체한다.
  heading: { color: "#1F2937" },
});
