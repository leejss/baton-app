import { Modal, StyleSheet, View } from 'react-native';

import { Pressable, Text } from '@/shared/ui';
import { radius, shadows, spacing, useTheme } from '@/theme';

type DeleteHandoffDialogProps = {
  isDeleting: boolean;
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteHandoffDialog({
  isDeleting,
  visible,
  onCancel,
  onConfirm,
}: DeleteHandoffDialogProps) {
  const theme = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlayDimmed }]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            shadows.strong,
            { backgroundColor: theme.colors.backgroundDefault },
          ]}
        >
          <View style={styles.copy}>
            <Text variant="title" weight="semibold" style={styles.centerText}>
              인수인계를 삭제할까요?
            </Text>
            <Text color="foregroundDefault" style={styles.centerText}>
              삭제한 인수인계는 되돌릴 수 없어요.
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="삭제 취소"
              disabled={isDeleting}
              onPress={onCancel}
              style={[styles.button, { backgroundColor: theme.colors.surfaceNeutralSubtle }]}
            >
              <Text weight="medium">취소</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="인수인계 삭제 확인"
              accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
              disabled={isDeleting}
              onPress={onConfirm}
              style={[styles.button, { backgroundColor: theme.colors.surfaceWarningDefault }]}
            >
              <Text weight="medium" color="foregroundInverse">
                {isDeleting ? '삭제 중' : '삭제'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): Figma 삭제 다이얼로그의 300px 폭·48px 버튼 높이를 토큰화한다.
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 300,
    padding: spacing.md,
    gap: spacing.lg,
    borderRadius: radius.md,
  },
  copy: { gap: spacing.xs },
  centerText: { textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
