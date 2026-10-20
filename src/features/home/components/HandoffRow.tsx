import { Pressable, StyleSheet, View } from 'react-native';

import type { HomeHandoffItem } from '@/features/home/types';
import { Text } from '@/shared/ui';
import { radius, spacing, useTheme } from '@/theme';

type HandoffRowProps = {
  isPending: boolean;
  item: HomeHandoffItem;
  onConfirm: (id: number) => void;
};

export function HandoffRow({ isPending, item, onConfirm }: HandoffRowProps) {
  const theme = useTheme();
  const isDisabled = !item.canConfirm || isPending;
  const isConfirmed = item.status === 'CONFIRMED';
  const handleConfirm = () => onConfirm(item.id);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.surfaceNeutralSubtle }]}>
      <Text
        numberOfLines={1}
        variant="bodySmall"
        weight="semibold"
        color={isConfirmed ? 'foregroundDisabled' : 'foregroundStrong'}
        style={[styles.title, isConfirmed && styles.confirmedTitle]}
      >
        {item.title}
      </Text>
      <Pressable
        accessibilityLabel={`${item.title} 확인`}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: isPending }}
        disabled={isDisabled}
        onPress={handleConfirm}
        style={({ pressed }) => [styles.touchTarget, pressed && styles.pressed]}
      >
        <View
          style={[
            styles.buttonVisual,
            {
              backgroundColor: item.canConfirm
                ? theme.colors.surfaceNeutralStrong
                : theme.colors.borderDefault,
            },
          ]}
        >
          <Text
            variant="caption"
            weight="semibold"
            color={item.canConfirm ? 'foregroundInverse' : 'foregroundDisabled'}
          >
            확인
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 56,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  confirmedTitle: {
    textDecorationLine: 'line-through',
  },
  touchTarget: {
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonVisual: {
    minWidth: 52,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
