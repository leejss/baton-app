import { StyleSheet, View } from 'react-native';
import { EmployeeAvatar } from '@/features/schedules/components/EmployeeAvatar';

import type { ScheduleMember } from '@/features/schedules/types';
import { Pressable, Text } from '@/shared/ui';
import { Check } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

type EmployeeRowProps = {
  member: ScheduleMember;
  selected: boolean;
  onSelect: (id: number) => void;
};

export function EmployeeRow({ member, selected, onSelect }: EmployeeRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${member.name}, ${member.email}`}
      accessibilityState={{ selected }}
      onPress={() => onSelect(member.id)}
      style={styles.row}
    >
      <EmployeeAvatar size={34} />
      <View style={styles.info}>
        <Text
          variant="title"
          weight="semibold"
          color={selected ? 'foregroundStrong' : 'foregroundSubtle'}
        >
          {member.name}{' '}
          <Text variant="caption" color="foregroundSubtle">
            {member.role === 'MANAGER' ? '관리자' : '근로자'}
          </Text>
        </Text>
      </View>
      <View
        style={[
          styles.check,
          {
            borderColor: selected ? colors.surfaceBlueStrong : colors.borderDefault,
            backgroundColor: selected ? colors.surfaceBlueStrong : colors.backgroundDefault,
          },
        ]}
      >
        {selected && <Check size={16} color="foregroundInverse" />}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  // Figma 1097:39094: 아바타 34, 선택 표시 22.5, 행 간격 포함 64.
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: { flex: 1 },
  check: {
    width: 22.5,
    height: 22.5,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
