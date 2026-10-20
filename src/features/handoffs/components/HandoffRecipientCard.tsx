import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { MemberDto } from '@/features/stores/api/store.schema';
import { Pressable, Text } from '@/shared/ui';
import { ArrowRightS } from '@/shared/ui/icons';
import { getProfileImageSource } from '@/shared/ui/profileImageAssets';
import { radius, spacing, useTheme } from '@/theme';

type HandoffRecipientCardProps = {
  recipient: MemberDto | null;
  onPress: () => void;
};

export function HandoffRecipientCard({ recipient, onPress }: HandoffRecipientCardProps) {
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
          backgroundColor: theme.colors.backgroundDefault,
          borderColor: theme.colors.borderDefault,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.avatarFrame, { borderColor: theme.colors.surfaceNeutralSubtle }]}>
        <Image
          source={getProfileImageSource(
            recipient?.profileImage ?? { source: 'STATIC', key: 'DEFAULT_01' },
          )}
          contentFit="cover"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={styles.avatar}
        />
      </View>
      <View style={styles.copy}>
        <Text weight="semibold" color="foregroundStrong">
          {recipient === null ? '받는 사람을 선택해주세요.' : `${recipient.displayName} 님`}
        </Text>
        <Text variant="caption" weight="medium" color="foregroundSubtle">
          {recipient === null
            ? '한 명을 선택할 수 있어요'
            : (recipient.email ?? '이메일 제공 안 됨')}
        </Text>
      </View>
      <ArrowRightS size={22} color="foregroundDisabled" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 80,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
  },
  pressed: { opacity: 0.72 },
  avatarFrame: {
    width: 33,
    height: 33,
    borderWidth: 1.375,
    borderRadius: 30,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  copy: { flex: 1, minWidth: 0, gap: spacing.xs },
});
