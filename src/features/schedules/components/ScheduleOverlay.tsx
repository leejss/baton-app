import type { ReactNode } from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable, Text } from '@/shared/ui';
import { X } from '@/shared/ui/icons';
import { SCREEN_PADDING_X, radius, shadows, spacing, useTheme } from '@/theme';

type ScheduleOverlayProps = {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  variant?: 'default' | 'details';
  description?: ReactNode;
};

export function ScheduleOverlay({
  visible,
  title,
  children,
  onClose,
  busy = false,
  variant = 'default',
  description,
}: ScheduleOverlayProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compactClose = variant !== 'default';
  const closeButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} 닫기`}
      disabled={busy}
      accessibilityState={{ disabled: busy }}
      onPress={onClose}
      hitSlop={compactClose ? 10 : undefined}
      style={
        compactClose
          ? [styles.dialogClose, { backgroundColor: colors.surfaceNeutralSubtle }]
          : styles.close
      }
    >
      <X
        size={compactClose ? 14 : 20}
        color={compactClose ? 'foregroundSubtle' : 'foregroundDisabled'}
      />
    </Pressable>
  );
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={busy ? undefined : onClose}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlayDimmed }]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            variant !== 'default' && styles.dialog,
            variant === 'details' && styles.details,
            variant !== 'default' && shadows.default,
            {
              backgroundColor: colors.backgroundDefault,
              maxHeight: height - insets.top - spacing.md,
              paddingBottom: variant === 'default' ? spacing.lg : 21,
            },
          ]}
        >
          <View style={styles.textGroup}>
            <View style={styles.heading}>
              <Text
                variant="subheading"
                weight={variant === 'details' ? 'bold' : 'semibold'}
                style={styles.title}
              >
                {title}
              </Text>
              {closeButton}
            </View>
            {description}
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SCREEN_PADDING_X,
  },
  dialog: { gap: 22 },
  details: { paddingVertical: 21 },
  dialogClose: {
    alignSelf: 'flex-end',
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: { gap: 6, width: '100%' },
  card: {
    flexShrink: 1,
    width: '100%',
    maxWidth: 300,
    borderRadius: radius.md,
    padding: 20,
    gap: spacing.md,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
