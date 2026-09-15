import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/ui';
import { radius, useTheme } from '@/theme';

export function SettingsSection({
  title,
  children,
  spacing = 'default',
}: {
  title?: string;
  children: ReactNode;
  spacing?: 'default' | 'spacious' | 'compact';
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      {title && (
        <Text variant="bodySmall" weight="semibold" color="foregroundDisabled">
          {title}
        </Text>
      )}
      <View
        style={[
          styles.card,
          spacing === 'spacious' && styles.spacious,
          spacing === 'compact' && styles.compact,
          { borderColor: colors.borderDefault },
        ]}
      >
        {children}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: 11 },
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 9,
  },
  spacious: { paddingVertical: 21, gap: 25 },
  compact: { paddingVertical: 8 },
});
