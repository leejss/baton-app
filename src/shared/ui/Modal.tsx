import type { ReactNode } from 'react';
import { Modal as RNModal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/shared/ui/Button';
import { Text } from '@/shared/ui/Text';
import { X } from '@/shared/ui/icons';
import { radius, shadows, spacing, useTheme } from '@/theme';

type ModalVariant = 'icon' | 'text';

type ModalProps = {
  isVisible: boolean;
  variant?: ModalVariant;
  icon?: ReactNode;
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  /** 생략하면 닫기 버튼과 Android 뒤로가기로 닫히지 않는다. */
  onClose?: () => void;
};

const SPEC = {
  padding: 18,
  gap: 22,
  textGap: 6,
  closeSize: 24,
  closeIconSize: 14,
} as const;

const VARIANT_SPEC: Record<ModalVariant, { width: number; contentGap: number }> = {
  icon: { width: 260, contentGap: 16 },
  text: { width: 300, contentGap: 22 },
};

export const MODAL_ICON_SIZE = 50;

export function Modal({
  isVisible,
  variant = 'icon',
  icon,
  title,
  description,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
  onClose,
}: ModalProps) {
  const { colors } = useTheme();
  const variantSpec = VARIANT_SPEC[variant];

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlayDimmed }]}>
        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[
            styles.card,
            shadows.default,
            { width: variantSpec.width, backgroundColor: colors.backgroundDefault },
          ]}
        >
          <View>
            {onClose !== undefined && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="닫기"
                onPress={onClose}
                // 24pt라 최소 터치 영역(44)에 못 미친다. 여백으로 채운다.
                hitSlop={(44 - SPEC.closeSize) / 2}
                style={[styles.close, { backgroundColor: colors.surfaceNeutralSubtle }]}
              >
                <X size={SPEC.closeIconSize} color="foregroundSubtle" />
              </Pressable>
            )}

            <View style={[styles.content, { gap: variantSpec.contentGap }]}>
              {icon}
              <View style={styles.textGroup}>
                <Text variant="subheading" weight="semibold">
                  {title}
                </Text>
                {description !== undefined && (
                  <Text variant="bodySmall" color="foregroundDefault" style={styles.description}>
                    {description}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <Button label={confirmLabel} onPress={onConfirm} disabled={confirmDisabled} />
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    maxWidth: '100%',
    borderRadius: radius.md,
    padding: SPEC.padding,
    gap: SPEC.gap,
  },
  close: {
    alignSelf: 'flex-end',
    width: SPEC.closeSize,
    height: SPEC.closeSize,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center' },
  textGroup: { alignItems: 'center', gap: SPEC.textGap },
  description: { textAlign: 'center' },
});
