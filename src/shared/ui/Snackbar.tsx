import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { AlertCircleFill, CheckSquare } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

type SnackbarProps = {
  title: string;
  description?: string;
  tone?: 'warning' | 'success';
  actionLabel?: string;
  onAction?: () => void;
};

const SPEC = {
  paddingVertical: 12,
  paddingHorizontal: 16,
  gap: 8,
  messageGap: 4,
  iconSize: 24,
} as const;

export function Snackbar({
  title,
  description,
  tone = 'warning',
  actionLabel,
  onAction,
}: SnackbarProps) {
  const { colors } = useTheme();
  const StatusIcon = tone === 'success' ? CheckSquare : AlertCircleFill;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          backgroundColor:
            tone === 'success' ? colors.surfaceSuccessSoft : colors.surfaceWarningSoft,
          borderColor:
            tone === 'success' ? colors.borderSuccessDefault : colors.borderWarningDefault,
        },
      ]}
    >
      <StatusIcon
        size={SPEC.iconSize}
        color={tone === 'success' ? 'foregroundSuccessDefault' : 'foregroundWarningDefault'}
      />

      <View style={styles.message}>
        <Text variant="body" weight="semibold" style={styles.title}>
          {title}
        </Text>
        {description !== undefined && (
          <Text variant="caption" weight="medium" color="foregroundSubtle">
            {description}
          </Text>
        )}
      </View>

      {actionLabel !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          hitSlop={SPEC.paddingVertical}
        >
          <Text variant="bodySmall" weight="bold" color="foregroundWarningDefault">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: SPEC.paddingVertical,
    paddingHorizontal: SPEC.paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPEC.gap,
  },
  message: { flex: 1, gap: SPEC.messageGap },
  title: { opacity: 0.88 },
});
