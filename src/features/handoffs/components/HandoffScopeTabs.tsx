import { StyleSheet, View } from "react-native";

import type { HandoffScope } from "@/features/handoffs/types";
import { Pressable, Text } from "@/shared/ui";
import { spacing, useTheme } from "@/theme";

type HandoffScopeTabsProps = {
  value: HandoffScope;
  onChange: (scope: HandoffScope) => void;
};

const ITEMS: readonly { value: HandoffScope; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "received", label: "수신" },
  { value: "sent", label: "발신" },
];

export function HandoffScopeTabs({ value, onChange }: HandoffScopeTabsProps) {
  const theme = useTheme();

  return (
    <View accessibilityRole="tablist" style={styles.root}>
      {ITEMS.map((item) => {
        const selected = item.value === value;
        const handlePress = () => onChange(item.value);

        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityLabel={`${item.label} 인수인계`}
            accessibilityState={{ selected }}
            onPress={handlePress}
            style={[
              styles.tab,
              {
                backgroundColor: selected
                  ? theme.colors.navigationForeground
                  : theme.colors.border,
              },
            ]}
          >
            <Text
              variant="bodySmall"
              weight="medium"
              color={selected ? "accentOn" : "textPrimary"}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): 필터 탭의 64px 최소 폭·44px 높이를 칩 컴포넌트 토큰으로 동기화한다.
  root: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tab: {
    minWidth: 64,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
});
