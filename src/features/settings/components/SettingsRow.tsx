import { StyleSheet, View } from 'react-native';
import { Pressable, Text } from '@/shared/ui';
import { ArrowRightS } from '@/shared/ui/icons';
import { spacing } from '@/theme';

type SettingsRowProps = {
  label: string;
  value?: string;
  description?: string;
  onPress?: () => void;
};
export function SettingsRow({ label, value, description, onPress }: SettingsRowProps) {
  const content = (
    <>
      <View style={styles.copy}>
        <Text weight="semibold" color="foregroundStrong">
          {label}
        </Text>
        {description && (
          <Text variant="caption" weight="medium" color="foregroundDisabled">
            {description}
          </Text>
        )}
      </View>
      {value && (
        <Text color="foregroundDefault" numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      )}
      {onPress && <ArrowRightS color="foregroundDisabled" />}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[label, value].filter(Boolean).join(', ')}
      onPress={onPress}
      style={styles.row}
    >
      {content}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: spacing.xs },
  copy: { flex: 1, gap: 2 },
  value: { flexShrink: 1, maxWidth: '60%' },
});
