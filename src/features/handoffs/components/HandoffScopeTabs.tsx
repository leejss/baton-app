import { StyleSheet, View } from 'react-native';

import type { HandoffScope } from '@/features/handoffs/types';
import { Pressable, Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

type HandoffScopeTabsProps = {
  value: HandoffScope;
  onChange: (scope: HandoffScope) => void;
};

const ITEMS: readonly { value: HandoffScope; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'received', label: '수신' },
  { value: 'sent', label: '발신' },
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
                  ? theme.colors.surfaceNeutralStrong
                  : theme.colors.surfaceNeutralMedium,
              },
            ]}
          >
            <Text
              variant="body"
              weight="semibold"
              color={selected ? 'foregroundInverse' : 'foregroundDefault'}
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
  root: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    minWidth: 64,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
});
