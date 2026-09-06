import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import type { HandoffCardModel } from '@/features/handoffs/model/handoff';
import { HandoffTypeIcon } from '@/features/handoffs/components/HandoffTypeIcon';
import { Pressable, Text } from '@/shared/ui';
import { KebabMenu } from '@/shared/ui/icons';
import { spacing, useTheme } from '@/theme';

type HandoffCardProps = {
  item: HandoffCardModel;
  onPress: (handoffId: string) => void;
  onManagePress: (handoffId: string) => void;
};

export function HandoffCard({ item, onPress, onManagePress }: HandoffCardProps) {
  const theme = useTheme();
  const handlePress = () => onPress(item.id);
  const handleManagePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onManagePress(item.id);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.typeLabel}, ${item.title}, ${item.statusLabel}`}
      accessibilityState={{ disabled: !item.canOpenDetail }}
      disabled={!item.canOpenDetail}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.root,
        { backgroundColor: theme.colors.background },
        pressed && styles.pressed,
      ]}
    >
      <HandoffTypeIcon type={item.type} />

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text variant="caption" color="textTertiary">
            {item.dateLabel}
          </Text>
          <Text
            variant="caption"
            weight="medium"
            color={item.status === 'UNCONFIRMED' ? 'textPrimary' : 'textTertiary'}
          >
            {item.statusLabel}
          </Text>
        </View>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {item.title}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {item.senderName} → {item.recipientName}
        </Text>
      </View>

      {item.canManage && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.title} 수정 및 삭제 메뉴`}
          hitSlop={spacing.xs}
          onPress={handleManagePress}
          style={styles.manageButton}
        >
          <KebabMenu size={18} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 98,
    paddingLeft: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderCurve: 'continuous',
    // TODO(design-system): 카드의 12px 세로 여백·16px radius가 토큰화되면 교체한다.
  },
  pressed: { opacity: 0.72 },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  manageButton: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
