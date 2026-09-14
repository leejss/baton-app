import { StyleSheet, View } from 'react-native';

import type { ScheduleItem } from '@/features/schedules/types';
import { Pressable, Text } from '@/shared/ui';
import { EmployeeAvatar } from '@/features/schedules/components/EmployeeAvatar';
import { Check, SendFill } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

type ScheduleWorkerRowProps = {
  item: ScheduleItem;
  canHandoff: boolean;
  isManaging?: boolean;
  canEdit?: boolean;
  selected?: boolean;
  onHandoff: (id: number) => void;
  onSelect: (id: number) => void;
};

export function ScheduleWorkerRow({
  item,
  canHandoff,
  isManaging,
  canEdit,
  selected = false,
  onHandoff,
  onSelect,
}: ScheduleWorkerRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <EmployeeAvatar />
      <View style={styles.details}>
        <Text weight="semibold" numberOfLines={1}>
          {item.member.name}
        </Text>
        <Text variant="caption" color="foregroundSubtle">
          {item.startTime} - {item.endTime}
          {!item.member.isActive ? ' · 참여 종료' : ''}
        </Text>
      </View>
      {isManaging ? (
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
                backgroundColor: selected
                  ? colors.surfaceBlueStrong
                  : canEdit
                    ? colors.backgroundDefault
                    : colors.surfaceNeutralDisabled,
              },
            ]}
          >
            {selected && <Check size={14} color="foregroundInverse" />}
          </View>
          {!canEdit && (
            <Text variant="caption" color="foregroundDisabled">
              시작됨
            </Text>
          )}
        </Pressable>
      ) : (
        canHandoff && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.member.name}님에게 인수인계 작성`}
            onPress={() => onHandoff(item.member.id)}
            style={styles.action}
          >
            <View style={[styles.handoff, { backgroundColor: colors.surfaceBlueDefault }]}>
              <SendFill size={16} color="foregroundBlueSoft" />
              <Text variant="bodySmall" weight="semibold" color="foregroundBlueDefault">
                인수인계
              </Text>
            </View>
          </Pressable>
        )
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  details: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  action: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handoff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  // Figma 1097:43192: 체크 표시 18px, 모서리 6px.
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
