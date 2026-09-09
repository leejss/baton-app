import type { ReactNode } from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable, Text } from '@/shared/ui';
import { X } from '@/shared/ui/icons';
import { SCREEN_PADDING_X, radius, spacing, useTheme } from '@/theme';

type ScheduleOverlayProps = {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
};

export function ScheduleOverlay({
  visible,
  title,
  children,
  onClose,
  busy = false,
}: ScheduleOverlayProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={busy ? undefined : onClose}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            {
              backgroundColor: colors.background,
              maxHeight: height - insets.top - spacing.md,
              paddingBottom: spacing.lg,
            },
          ]}
        >
          <View style={styles.heading}>
            <Text variant="subheading" weight="semibold" style={styles.title}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${title} 닫기`}
              disabled={busy}
              accessibilityState={{ disabled: busy }}
              onPress={onClose}
              style={styles.close}
            >
              <X size={20} color="textDisabled" />
            </Pressable>
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
  // TODO(design-system): Figma 1097:41380의 300px 모달 폭·20px 안쪽 여백을 sync한다.
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
