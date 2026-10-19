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
      accessibilityLabel={`${item.member.displayName}, ${item.member.email ?? '이메일 제공 안 됨'}`}
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <HandoffAvatar
        profileImage={item.member.profileImage}
        style={[styles.avatar, { borderColor: theme.colors.borderSubtle }]}
      />
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Text
            weight="semibold"
            color={selected ? 'foregroundStrong' : 'foregroundDisabled'}
            style={styles.name}
          >
            {item.member.displayName} 님
          </Text>
        </View>
        <Text
          variant="caption"
          weight="medium"
          color={selected ? 'foregroundDefault' : 'foregroundSubtle'}
        >
          {item.member.email ?? '이메일 제공 안 됨'}
        </Text>
      </View>
      {selected && <Check size={24} color="foregroundBlueSoft" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pressed: { opacity: 0.72 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { flexShrink: 1 },
  // Figma 받는 사람 선택(732:21516)의 프로필 크기와 테두리.
  avatar: { width: 33, height: 33, borderWidth: 1.375 },
});
