import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { MemberDto } from '@/features/handoffs/api/handoff.schema';
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
      <View style={[styles.avatarFrame, { borderColor: theme.colors.surfaceSunken }]}>
        <Image
          source={require('@/assets/images/home/profile-placeholder.png')}
          contentFit="cover"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={styles.avatar}
        />
      </View>
      <View style={styles.copy}>
        <Text weight="semibold" style={styles.name}>
          {recipient === null ? '받는 사람을 선택해주세요.' : `${recipient.displayName} 님`}
        </Text>
        <Text variant="caption" weight="medium" style={styles.description}>
          {recipient === null
            ? '한 명을 선택할 수 있어요'
            : isRecommended
              ? '다음 근무자'
              : recipient.email}
        </Text>
      </View>
      <ArrowRightS size={22} color="textDisabled" />
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
    // TODO(design-system): Figma 291:8370의 요소 간 10px 간격을 spacing 토큰과 동기화한다.
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
  // TODO(design-system): Figma foreground/strong·subtle가 시맨틱 컬러에 추가되면 원시값을 교체한다.
  name: { color: '#1F2937' },
  description: { color: '#9CA3AF' },
});
