import { useState } from 'react';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { Modal, StyleSheet, View } from 'react-native';

import { HandoffFooterActions } from '@/features/handoffs/components/HandoffFooterActions';
import { HandoffRecipientRow } from '@/features/handoffs/components/HandoffRecipientRow';
import type { MemberDto } from '@/features/stores/api/store.schema';
import { EmptyState, TextInput } from '@/shared/ui';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { useTheme } from '@/theme';

type HandoffRecipientPickerModalProps = {
  recipients: MemberDto[];
  selectedId: number | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSelect: (item: MemberDto) => void;
};

export function HandoffRecipientPickerModal({
  recipients,
  selectedId,
  visible,
  onClose,
  onConfirm,
  onSelect,
}: HandoffRecipientPickerModalProps) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const searchTerm = search.trim().toLowerCase();
  const filtered = recipients.filter((member) =>
    `${member.displayName} ${member.email ?? ''}`.toLowerCase().includes(searchTerm),
  );
  const renderItem: ListRenderItem<MemberDto> = ({ item }) => (
    <HandoffRecipientRow item={item} selected={item.userId === selectedId} onSelect={onSelect} />
  );
  const separator = () => (
    <View style={[styles.separator, { backgroundColor: theme.colors.borderDefault }]} />
  );

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View
        accessibilityViewIsModal
        style={[styles.root, { backgroundColor: theme.colors.backgroundDefault }]}
      >
        <ScreenHeader title="받는 사람 선택" onBack={onClose} />
        <TextInput
          accessibilityLabel="담당자 이름 또는 이메일 검색"
          placeholder="이름, 이메일로 검색해주세요."
          value={search}
          onChangeText={setSearch}
          style={{ marginHorizontal: 18, marginVertical: 12 }}
        />
        <FlashList
          data={filtered}
          contentInsetAdjustmentBehavior="automatic"
          ItemSeparatorComponent={separator}
          keyExtractor={keyExtractor}
          ListEmptyComponent={<EmptyState title="선택할 수 있는 멤버가 없어요" />}
          renderItem={renderItem}
          style={styles.list}
        />
        <HandoffFooterActions
          primaryLabel="확인"
          primaryDisabled={!recipients.some((item) => item.userId === selectedId)}
          onPrimaryPress={onConfirm}
        />
      </View>
    </Modal>
  );
}

function keyExtractor(item: MemberDto) {
  return String(item.userId);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: 18 },
});
