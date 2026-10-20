import { StyleSheet, View } from 'react-native';

import { HandoffAvatar } from '@/features/handoffs/components/HandoffAvatar';
import type { MemberDto } from '@/features/stores/api/store.schema';
import { Pressable, Text } from '@/shared/ui';
import { Check } from '@/shared/ui/icons';
import { spacing, useTheme } from '@/theme';

type HandoffRecipientRowProps = {
  item: MemberDto;
  selected: boolean;
  onSelect: (item: MemberDto) => void;
};

export function HandoffRecipientRow({ item, selected, onSelect }: HandoffRecipientRowProps) {
  const theme = useTheme();
  const handlePress = () => onSelect(item);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${item.displayName}, ${item.email ?? '이메일 제공 안 됨'}`}
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <HandoffAvatar
        profileImage={item.profileImage}
        style={[styles.avatar, { borderColor: theme.colors.borderSubtle }]}
      />
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Text
            weight="semibold"
            color={selected ? 'foregroundStrong' : 'foregroundDisabled'}
            style={styles.name}
          >
            {item.displayName} 님
          </Text>
        </View>
        <Text
          variant="caption"
          weight="medium"
          color={selected ? 'foregroundDefault' : 'foregroundSubtle'}
        >
          {item.email ?? '이메일 제공 안 됨'}
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
  avatar: { width: 33, height: 33, borderWidth: 1.375 },
});
