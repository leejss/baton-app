import { StyleSheet, View } from 'react-native';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { Text } from '@/shared/ui';
import { radius, spacing, useTheme } from '@/theme';

export function InvitationStoreCard() {
  const { profile, membership } = useMainContext();
  const { colors } = useTheme();
  const store = membership.store;
  const fields = [
    ['주소', [store.address, store.detailAddress].filter(Boolean).join(' ')],
    ['관리자', profile.displayName],
    ['연락처', store.storeContact],
  ];
  return (
    <View style={[styles.card, { borderColor: colors.border }]}>
      <Text weight="semibold" color="navigationForeground">
        {store.storeName} {store.branchName}
      </Text>
      {fields.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text variant="bodySmall" color="textDisabled" style={styles.label}>
            {label}
          </Text>
          <Text variant="bodySmall" color="textSecondary" style={styles.value}>
            {value}
          </Text>
        </View>
      ))}
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
  row: { flexDirection: 'row', gap: spacing.sm },
  label: { width: 48 },
  value: { flex: 1 },
});
