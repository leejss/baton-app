import { StyleSheet, View } from 'react-native';

import { HandoffAvatar } from '@/features/handoffs/components/HandoffAvatar';
import type { RecipientModel } from '@/features/handoffs/types';
import { Pressable, Text } from '@/shared/ui';
import { Check } from '@/shared/ui/icons';
import { spacing, useTheme } from '@/theme';

type HandoffRecipientRowProps = {
  item: RecipientModel;
  selected: boolean;
  onSelect: (item: RecipientModel) => void;
};

export function HandoffRecipientRow({ item, selected, onSelect }: HandoffRecipientRowProps) {
  const theme = useTheme();
  const handlePress = () => onSelect(item);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${item.member.displayName}, ${item.nextShiftLabel ?? '근무 시간 미정'}`}
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <HandoffAvatar name={item.member.displayName} />
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Text weight="semibold">{item.member.displayName}</Text>
          {item.isRecommended && (
            <View style={[styles.badge, { backgroundColor: theme.colors.accentSubtle }]}>
              <Text variant="caption" weight="medium" color="accentText">
                다음 근무자
              </Text>
            </View>
          )}
        </View>
        <Text variant="bodySmall" color="textSecondary">
          {item.nextShiftLabel ?? '근무 시간 미정'}
        </Text>
      </View>
      <View
        style={[
          styles.check,
          {
            backgroundColor: selected ? theme.colors.navigationForeground : theme.colors.background,
            borderColor: selected ? theme.colors.navigationForeground : theme.colors.border,
          },
        ]}
      >
        {selected && <Check size={16} color="accentOn" />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // TODO(design-system): 수신자 행의 12px 세로·요소 간격을 토큰화한다.
  },
  pressed: { opacity: 0.72 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  check: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
