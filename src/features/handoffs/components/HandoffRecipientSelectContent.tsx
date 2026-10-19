import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { HandoffFooterActions } from '@/features/handoffs/components/HandoffFooterActions';
import { HandoffRecipientRow } from '@/features/handoffs/components/HandoffRecipientRow';
import type { RecipientModel } from '@/features/handoffs/types';
import { useHandoffDraftStore } from '@/features/handoffs/store/handoffDraftStore';
import { EmptyState, TextInput } from '@/shared/ui';
import { SCREEN_PADDING_X, spacing, useTheme } from '@/theme';

type HandoffRecipientSelectContentProps = {
  onConfirm: () => void;
};

export function HandoffRecipientSelectContent({ onConfirm }: HandoffRecipientSelectContentProps) {
  const context = useMainContext();
  const theme = useTheme();
  const { data } = useSuspenseQuery(handoffQueries.recipients(context.workspaceId, context.userId));
  const recipient = useHandoffDraftStore((state) => state.recipient);
  const setRecipient = useHandoffDraftStore((state) => state.setRecipient);
  const [selectedId, setSelectedId] = useState<number | null>(recipient?.member.userId ?? null);
  const [search, setSearch] = useState('');
  const filtered = data.filter(({ member }) =>
    `${member.displayName} ${member.email ?? ''}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  const handleSelect = (item: RecipientModel) => setSelectedId(item.member.userId);
  const handleConfirm = () => {
    const selected = data.find(({ member }) => member.userId === selectedId);
    if (selected === undefined) return;
    setRecipient(selected);
    onConfirm();
  };
  const renderItem: ListRenderItem<RecipientModel> = ({ item }) => (
    <HandoffRecipientRow
      item={item}
      selected={item.member.userId === selectedId}
      onSelect={handleSelect}
    />
  );
  const separator = () => (
    <View style={[styles.separator, { backgroundColor: theme.colors.dividerStrong }]} />
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.backgroundDefault }]}>
      <TextInput
        accessibilityLabel="담당자 이름 또는 이메일 검색"
        placeholder="이름, 이메일로 검색해주세요."
        value={search}
        onChangeText={setSearch}
        style={{ marginHorizontal: SCREEN_PADDING_X, marginTop: 16 }}
      />
      <FlashList
        data={filtered}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={separator}
        ListFooterComponent={data.length > 0 ? separator : null}
        keyExtractor={keyExtractor}
        ListEmptyComponent={<EmptyState title="선택할 수 있는 멤버가 없어요" />}
        renderItem={renderItem}
        style={styles.list}
      />
      <HandoffFooterActions
        primaryLabel="확인"
        primaryDisabled={!data.some((item) => item.member.userId === selectedId)}
        onPrimaryPress={handleConfirm}
      />
    </View>
  );
}

function keyExtractor(item: RecipientModel) {
  return String(item.member.userId);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: SCREEN_PADDING_X, paddingTop: 20 },
  separator: { height: 1, marginVertical: spacing.md },
});
