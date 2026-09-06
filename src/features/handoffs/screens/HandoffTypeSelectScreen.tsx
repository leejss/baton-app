import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { HandoffTypeDto } from '@/features/handoffs/api/handoff.schema';
import { HandoffFooterActions } from '@/features/handoffs/components/HandoffFooterActions';
import { HandoffHeader } from '@/features/handoffs/components/HandoffHeader';
import { HandoffTypeOption } from '@/features/handoffs/components/HandoffTypeOption';
import {
  hasHandoffDraftChanges,
  useHandoffDraftStore,
} from '@/features/handoffs/model/handoffDraftStore';
import { useUnsavedHandoffGuard } from '@/features/handoffs/model/useUnsavedHandoffGuard';
import { Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

type HandoffTypeSelectScreenProps = {
  onExit: () => void;
  onNext: () => void;
};

const OPTIONS: readonly {
  type: HandoffTypeDto;
  label: string;
  description: string;
}[] = [
  { type: 'WORK_TASK', label: '업무 처리', description: '못 끝낸 일, 정산 등' },
  { type: 'STORE_STATUS', label: '매장 상태', description: '장비 · 기기, 재고 등' },
  { type: 'OTHER', label: '기타', description: '고객, 특이사항 등' },
];

export function HandoffTypeSelectScreen({ onExit, onNext }: HandoffTypeSelectScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const type = useHandoffDraftStore((state) => state.type);
  const hasChanges = useHandoffDraftStore(hasHandoffDraftChanges);
  const setType = useHandoffDraftStore((state) => state.setType);
  const reset = useHandoffDraftStore((state) => state.reset);
  const handleExit = useUnsavedHandoffGuard({
    hasChanges,
    title: '작성을 그만할까요?',
    message: '작성 중인 내용은 저장되지 않아요.',
    onDiscard: reset,
    onLeave: onExit,
  });

  return (
    <View
      style={[styles.root, { backgroundColor: theme.colors.surfaceSunken, paddingTop: insets.top }]}
    >
      <HandoffHeader leading="close" onLeadingPress={handleExit} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        <Text variant="heading" weight="semibold">
          어떤 내용을{`\n`}전달해야 하나요?
        </Text>
        <View style={styles.options}>
          {OPTIONS.map((option) => (
            <HandoffTypeOption
              key={option.type}
              {...option}
              selected={type === option.type}
              onSelect={setType}
            />
          ))}
        </View>
      </ScrollView>
      <HandoffFooterActions
        primaryLabel="다음"
        primaryDisabled={type === null}
        onPrimaryPress={onNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
    // TODO(design-system): 작성 화면의 18px 좌우 여백을 레이아웃 토큰으로 동기화한다.
  },
  options: { gap: 12 },
});
