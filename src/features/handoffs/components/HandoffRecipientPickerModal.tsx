import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { Modal, StyleSheet, View } from 'react-native';

import { HandoffFooterActions } from '@/features/handoffs/components/HandoffFooterActions';
import { HandoffRecipientRow } from '@/features/handoffs/components/HandoffRecipientRow';
import type { RecipientModel } from '@/features/handoffs/model/handoff';
import { EmptyState } from '@/shared/ui';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { useTheme } from '@/theme';

type HandoffRecipientPickerModalProps = {
  recipients: RecipientModel[];
  selectedId: string | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSelect: (item: RecipientModel) => void;
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
  const renderItem: ListRenderItem<RecipientModel> = ({ item }) => (
    <HandoffRecipientRow
      item={item}
      selected={item.member.userId === selectedId}
      onSelect={onSelect}
    />
  );
  const separator = () => (
    <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
  );

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View
        accessibilityViewIsModal
        style={[styles.root, { backgroundColor: theme.colors.background }]}
      >
        <ScreenHeader title="받는 사람 선택" onBack={onClose} />
        <FlashList
          data={recipients}
          contentInsetAdjustmentBehavior="automatic"
          ItemSeparatorComponent={separator}
          keyExtractor={keyExtractor}
          ListEmptyComponent={<EmptyState title="선택할 수 있는 직원이 없어요" />}
          renderItem={renderItem}
          style={styles.list}
        />
        <HandoffFooterActions
          primaryLabel="확인"
          primaryDisabled={selectedId === null}
          onPrimaryPress={onConfirm}
        />
      </View>
    </Modal>
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
