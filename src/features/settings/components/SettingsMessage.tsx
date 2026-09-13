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
          backgroundColor: isError ? colors.surfaceWarningSoft : colors.surfaceSuccessSoft,
          borderColor: isError ? colors.borderWarningDefault : colors.borderSuccessDefault,
        },
      ]}
    >
      {isError ? (
        <AlertCircleFill size={20} color="foregroundWarningDefault" />
      ) : (
        <CheckSquare size={20} color="foregroundSuccessDefault" />
      )}
      <Text variant="bodySmall" weight="medium" color="foregroundDefault" style={styles.text}>
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
