import { StyleSheet, View } from 'react-native';
import { EmployeeAvatar } from '@/features/schedules/components/EmployeeAvatar';

import type { ScheduleMember } from '@/features/schedules/types';
import { Pressable, Text } from '@/shared/ui';
import { Check } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

type EmployeeRowProps = {
  member: ScheduleMember;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: number) => void;
};

export function EmployeeRow({ member, selected, disabled = false, onSelect }: EmployeeRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${member.name}, ${member.email}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => onSelect(member.id)}
      style={styles.row}
    >
      <EmployeeAvatar role={member.role} size={34} />
      <View style={styles.info}>
        <Text
          variant="title"
          weight="semibold"
          color={disabled ? 'foregroundDisabled' : 'foregroundStrong'}
        >
          {member.name}
        </Text>
        <Text variant="caption" color={disabled ? 'foregroundDisabled' : 'foregroundSubtle'}>
          {member.role === 'MANAGER' ? '관리자' : '근로자'}
        </Text>
      </View>
      <View style={styles.checkSlot}>
        <View
          style={[
            styles.check,
            {
              borderColor: selected
                ? colors.surfaceBlueStrong
                : disabled
                  ? colors.borderSubtle
                  : colors.borderDefault,
              backgroundColor: selected
                ? colors.surfaceBlueStrong
                : disabled
                  ? colors.surfaceNeutralDisabled
                  : colors.backgroundDefault,
            },
          ]}
        >
          {selected && <Check size={16} color="foregroundInverse" />}
        </View>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkSlot: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 22.5,
    height: 22.5,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
