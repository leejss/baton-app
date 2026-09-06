import { Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable, Text } from '@/shared/ui';
import { EditFill, Trash, X } from '@/shared/ui/icons';
import { radius, spacing, useTheme } from '@/theme';

type HandoffActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

export function HandoffActionSheet({
  visible,
  onClose,
  onDelete,
  onEdit,
}: HandoffActionSheetProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="메뉴 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
            },
          ]}
        >
          <View style={[styles.menu, { backgroundColor: theme.colors.surfaceSunken }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="인수인계 수정"
              onPress={onEdit}
              style={styles.row}
            >
              <EditFill />
              <Text weight="medium">수정하기</Text>
            </Pressable>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="인수인계 삭제"
              onPress={onDelete}
              style={styles.row}
            >
              <Trash color="danger" />
              <Text weight="medium" color="danger">
                삭제하기
              </Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="닫기"
            onPress={onClose}
            style={[styles.close, { backgroundColor: theme.colors.surfaceSunken }]}
          >
            <X />
            <Text weight="medium">닫기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): 바텀시트의 20px 상단 여백·56px 행 높이를 컴포넌트 토큰으로 동기화한다.
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: spacing.md,
    paddingTop: 20,
    gap: spacing.sm,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  menu: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
  },
  close: {
    minHeight: 56,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
