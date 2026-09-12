import { StyleSheet, View } from 'react-native';
import type { MemberDto } from '@/features/stores/api/store.schema';
import { ProfileAvatar } from '@/features/settings/components/ProfileAvatar';
import { Pressable, Text } from '@/shared/ui';
import { radius, spacing, useTheme } from '@/theme';

type MemberRowProps = { member: MemberDto; isSelected?: boolean; onSelect?: (id: number) => void };
export function MemberRow({ member, isSelected, onSelect }: MemberRowProps) {
  const { colors } = useTheme();
  if (!onSelect)
    return (
      <View style={styles.employee}>
        <ProfileAvatar profileImage={member.profileImage} />
        <Text variant="title" weight="semibold" color="navigationForeground">
          {member.displayName}
        </Text>
        <Text variant="caption" color="textDisabled" style={styles.email}>
          {member.email}
        </Text>
      </View>
    );
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${member.displayName}, ${member.email}`}
      accessibilityState={{ checked: isSelected }}
      onPress={() => onSelect(member.userId)}
      style={[styles.choice, { borderColor: isSelected ? colors.textDisabled : colors.border }]}
    >
      <View
        style={[
          styles.radio,
          {
            borderColor: isSelected ? colors.surfaceInverse : colors.border,
            backgroundColor: isSelected ? colors.surfaceInverse : colors.background,
          },
        ]}
      >
        {isSelected && <View style={[styles.dot, { backgroundColor: colors.onSurfaceInverse }]} />}
      </View>
      <View style={styles.details}>
        <Text weight="semibold" color="navigationForeground">
          {member.displayName}
        </Text>
        <Text variant="bodySmall" color="textDisabled">
          {member.email}
        </Text>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  employee: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 70 },
  email: { flex: 1 },
  choice: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 82,
  },
  radio: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  details: { flex: 1, gap: spacing.xs },
});
