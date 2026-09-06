import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { HandoffFooterActions } from '@/features/handoffs/components/HandoffFooterActions';
import { HandoffHeader } from '@/features/handoffs/components/HandoffHeader';
import { HandoffRecipientRow } from '@/features/handoffs/components/HandoffRecipientRow';
import type { RecipientModel } from '@/features/handoffs/model/handoff';
import { useHandoffDraftStore } from '@/features/handoffs/model/handoffDraftStore';
import { EmptyState } from '@/shared/ui';
import { useTheme } from '@/theme';

type HandoffRecipientSelectScreenProps = {
  onBack: () => void;
  onConfirm: () => void;
};

export function HandoffRecipientSelectScreen({
  onBack,
  onConfirm,
}: HandoffRecipientSelectScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { data } = useSuspenseQuery(handoffQueries.recipients());
  const recipient = useHandoffDraftStore((state) => state.recipient);
  const setRecipient = useHandoffDraftStore((state) => state.setRecipient);
  const [selectedId, setSelectedId] = useState<string | null>(recipient?.member.userId ?? null);
  const effectiveSelectedId =
    selectedId ?? data.find(({ isRecommended }) => isRecommended)?.member.userId ?? null;

  const handleSelect = (item: RecipientModel) => setSelectedId(item.member.userId);
  const handleConfirm = () => {
    const selected = data.find(({ member }) => member.userId === effectiveSelectedId);
    if (selected === undefined) return;
    setRecipient(selected);
    onConfirm();
  };
  const renderItem: ListRenderItem<RecipientModel> = ({ item }) => (
    <HandoffRecipientRow
      item={item}
      selected={item.member.userId === effectiveSelectedId}
      onSelect={handleSelect}
    />
  );
  const separator = () => (
    <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
  );

  return (
    <View
      style={[styles.root, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}
    >
      <HandoffHeader title="받는 사람 선택" onLeadingPress={onBack} />
      <FlashList
        data={data}
        contentInsetAdjustmentBehavior="automatic"
        ItemSeparatorComponent={separator}
        keyExtractor={keyExtractor}
        ListEmptyComponent={<EmptyState title="선택할 수 있는 직원이 없어요" />}
        renderItem={renderItem}
        style={styles.list}
      />
      <HandoffFooterActions
        primaryLabel="확인"
        primaryDisabled={effectiveSelectedId === null}
        onPrimaryPress={handleConfirm}
      />
    </View>
  );
}

function keyExtractor(item: RecipientModel) {
  return item.member.userId;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: 18 },
  // TODO(design-system): 수신자 목록 구분선의 18px 좌우 여백을 레이아웃 토큰으로 동기화한다.
});
