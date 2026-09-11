import { StyleSheet, View } from "react-native";

import type { ScheduleMember } from "@/features/schedules/types";
import { Pressable, Text } from "@/shared/ui";
import { Check, NavUserLine } from "@/shared/ui/icons";
import { radius, spacing, useTheme } from "@/theme";

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
      <View style={[styles.avatar, { backgroundColor: colors.surfaceSunken }]}>
        <NavUserLine size={20} color="textTertiary" />
      </View>
      <View style={styles.info}>
        <Text weight="semibold">
          {member.name}{" "}
          <Text variant="caption" color="textTertiary">
            {member.role === "MANAGER" ? "관리자" : "근로자"}
          </Text>
        </Text>
        <Text variant="caption" color="textSecondary">
          {member.email}
        </Text>
      </View>
      <View
        style={[
          styles.check,
          {
            borderColor: selected ? colors.accent : colors.border,
            backgroundColor: selected ? colors.accent : colors.background,
          },
        ]}
      >
        {selected && <Check size={16} color="accentOn" />}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  // TODO(design-system): Figma 직원 선택 행의 34px 아바타·22px 선택 표시와 최소 행 높이를 sync한다.
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  info: { flex: 1 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
