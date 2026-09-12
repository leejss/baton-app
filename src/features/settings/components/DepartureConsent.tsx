import { StyleSheet, View } from 'react-native';
import { DEPARTURE_COPY } from '@/features/settings/lib/departure';
import { Checkbox, Pressable, Text, TextLink } from '@/shared/ui';
import { radius, spacing, useTheme } from '@/theme';

type DepartureConsentProps = {
  kind: 'leave' | 'withdraw';
  acknowledged: boolean;
  isPending: boolean;
  onToggle: () => void;
  onConfirm: () => void;
};
export function DepartureConsent({
  kind,
  acknowledged,
  isPending,
  onToggle,
  onConfirm,
}: DepartureConsentProps) {
  const { colors } = useTheme();
  const copy = DEPARTURE_COPY[kind];
  return (
    <View style={styles.root}>
      <Text variant="bodySmall" weight="medium" color="textDisabled">
        {copy.section}
      </Text>
      <View style={[styles.card, { borderColor: colors.border }]}>
        {copy.items.map(([title, description]) => (
          <View key={title} style={styles.item}>
            <Text variant="bodySmall" weight="semibold" color="textSecondary">
              {title}
            </Text>
            <Text variant="caption" weight="medium" color="textDisabled">
              {description}
            </Text>
          </View>
        ))}
      </View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel="위 내용을 모두 확인했으며 이에 동의합니다"
        accessibilityState={{ checked: acknowledged, disabled: isPending }}
        disabled={isPending}
        onPress={onToggle}
        style={[styles.consent, { borderColor: colors.border }]}
      >
        <Checkbox isChecked={acknowledged} />
        <Text variant="caption" color="textDisabled" style={styles.consentText}>
          [필수] 위 내용을 모두 확인 했으며, 이에 동의합니다.
        </Text>
      </Pressable>
      <View style={styles.action}>
        <TextLink
          label={isPending ? '처리 중…' : copy.action}
          color="textTertiary"
          disabled={!acknowledged || isPending}
          onPress={onConfirm}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { marginTop: 17, gap: 11 },
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 21,
    gap: 25,
  },
  item: { gap: 2, minHeight: 54 },
  consent: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 58,
  },
  consentText: { flex: 1 },
  action: { marginTop: 54, marginBottom: spacing.lg, minHeight: 44, justifyContent: 'center' },
});
