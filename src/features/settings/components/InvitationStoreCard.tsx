import { StyleSheet, View } from 'react-native';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { Text } from '@/shared/ui';
import { radius, spacing, useTheme } from '@/theme';
export function InvitationStoreCard() {
  const { membership } = useMainContext();
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { borderColor: colors.borderDefault }]}>
      <Text weight="semibold" color="foregroundStrong">
        {membership.workspace.name}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: spacing.md,
  },
});
