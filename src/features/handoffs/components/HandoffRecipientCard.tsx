import { StyleSheet, View } from 'react-native';

import type { MemberDto } from '@/features/handoffs/api/handoff.schema';
import { HandoffAvatar } from '@/features/handoffs/components/HandoffAvatar';
import { Pressable, Text } from '@/shared/ui';
import { ArrowRightS } from '@/shared/ui/icons';
import { radius, spacing, useTheme } from '@/theme';

type HandoffRecipientCardProps = {
  isRecommended?: boolean;
  recipient: MemberDto | null;
  onPress: () => void;
};

export function HandoffRecipientCard({
  isRecommended = false,
  recipient,
  onPress,
}: HandoffRecipientCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        recipient === null ? '받는 사람 선택' : `받는 사람 ${recipient.displayName} 변경`
      }
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      {recipient === null ? (
        <View style={[styles.emptyAvatar, { backgroundColor: theme.colors.surfaceSunken }]} />
      ) : (
        <HandoffAvatar name={recipient.displayName} />
      )}
      <View style={styles.copy}>
        <Text weight="semibold">{recipient?.displayName ?? '받는 사람을 선택해 주세요'}</Text>
        <Text variant="caption" color="textSecondary">
          {recipient === null ? '한 명을 선택할 수 있어요' : recipient.email}
        </Text>
      </View>
      {recipient !== null && isRecommended && (
        <View style={[styles.badge, { backgroundColor: theme.colors.surfaceSunken }]}>
          <Text variant="caption" weight="medium">
            다음 근무자
          </Text>
        </View>
      )}
      <ArrowRightS />
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
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    // TODO(design-system): 수신자 카드의 12px 내부 간격을 토큰화한다.
  },
  pressed: { opacity: 0.72 },
  copy: { flex: 1, minWidth: 0 },
  emptyAvatar: { width: 44, height: 44, borderRadius: 999 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
});
