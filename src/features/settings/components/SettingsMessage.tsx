import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/ui';
import { AlertCircleFill, CheckSquare } from '@/shared/ui/icons';
import { radius, spacing, useTheme } from '@/theme';

export type SettingsFeedback = { tone: 'success' | 'error'; message: string };

export function SettingsMessage({ tone, message }: SettingsFeedback) {
  const { colors } = useTheme();
  const isError = tone === 'error';
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.root,
        {
          backgroundColor: isError ? colors.dangerSubtle : colors.successSubtle,
          borderColor: isError ? colors.dangerBorder : colors.success,
        },
      ]}
    >
      {isError ? (
        <AlertCircleFill size={20} color="danger" />
      ) : (
        <CheckSquare size={20} color="success" />
      )}
      <Text variant="bodySmall" weight="medium" color="textSecondary" style={styles.text}>
        {message}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  text: { flex: 1 },
});
