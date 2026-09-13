import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from '@/shared/ui';
import { radius, spacing, useTheme } from '@/theme';

type SettingsDialogProps = {
  visible: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Figma 1254:26678: 300px 확인창과 세로로 배치한 생성·취소 버튼. */
export function SettingsDialog({
  visible,
  title,
  description,
  children,
  confirmLabel,
  isPending,
  onConfirm,
  onCancel,
}: SettingsDialogProps) {
  const { colors } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isPending ? undefined : onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.overlay, { backgroundColor: colors.overlayDimmed }]}
      >
        <View
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: colors.backgroundDefault }]}
        >
          <View style={styles.copy}>
            <Text
              variant="subheading"
              weight="semibold"
              color="foregroundStrong"
              style={styles.center}
            >
              {title}
            </Text>
            {description && (
              <Text variant="bodySmall" color="foregroundDefault" style={styles.center}>
                {description}
              </Text>
            )}
          </View>
          {children}
          <View style={styles.actions}>
            <Button label={confirmLabel} size="bg" isLoading={isPending} onPress={onConfirm} />
            <Button label="취소" tone="weak" disabled={isPending} onPress={onCancel} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  card: { width: 300, maxWidth: '100%', borderRadius: radius.md, padding: 18, gap: 22 },
  copy: { gap: 6 },
  center: { textAlign: 'center' },
  actions: { gap: spacing.sm },
});
