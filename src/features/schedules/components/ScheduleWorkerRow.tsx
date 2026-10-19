import { StyleSheet, View } from 'react-native';
import type { ScheduleItem } from '@/features/schedules/types';
import { Pressable, Text } from '@/shared/ui';
import { EmployeeAvatar } from '@/features/schedules/components/EmployeeAvatar';
import { Check } from '@/shared/ui/icons';
import { useTheme } from '@/theme';
export function ScheduleWorkerRow({
  item,
  isManaging,
  canEdit,
  selected = false,
  onSelect,
}: {
  item: ScheduleItem;
  isManaging?: boolean;
  canEdit?: boolean;
  selected?: boolean;
  onSelect: (id: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <EmployeeAvatar profileImage={item.member.profileImage} />
      <View style={styles.details}>
        <Text weight="semibold">{item.member.name}</Text>
        <Text variant="caption" color="foregroundSubtle">
          {item.startTime} - {item.endTime}
          {!item.member.isActive ? ' · 참여 종료' : ''}
        </Text>
      </View>
      {isManaging && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.member.name} ${item.startTime} 근무 선택`}
          accessibilityState={{ disabled: !canEdit, selected }}
          disabled={!canEdit}
          onPress={() => onSelect(item.id)}
          style={styles.action}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: selected ? colors.surfaceBlueStrong : colors.borderDefault,
                backgroundColor: selected ? colors.surfaceBlueStrong : colors.backgroundDefault,
              },
            ]}
          >
            {selected && <Check size={14} color="foregroundInverse" />}
          </View>
          {!canEdit && (
            <Text variant="caption" color="foregroundDisabled">
              편집 불가
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6 },
  details: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  action: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
