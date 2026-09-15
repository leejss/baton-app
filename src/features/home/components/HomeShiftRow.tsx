import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { getHomeProfileImageSource } from '@/features/home/lib/homeAssets';
import type { HomeShiftItem } from '@/features/home/types';
import { Text } from '@/shared/ui';
import { SendFill } from '@/shared/ui/icons';
import { radius, spacing, useTheme } from '@/theme';

type HomeShiftRowProps = {
  item: HomeShiftItem;
  onCreateHandoff: (userId: number) => void;
};

export function HomeShiftRow({ item, onCreateHandoff }: HomeShiftRowProps) {
  const theme = useTheme();
  const handlePress = () => onCreateHandoff(item.userId);

  return (
    <View style={styles.root}>
      <View style={styles.employee}>
        <Image
          source={getHomeProfileImageSource(item.profileImageKey)}
          contentFit="cover"
          accessible={false}
          style={[styles.profile, { borderColor: theme.colors.surfaceNeutralSubtle }]}
        />
        <Text numberOfLines={1} weight="semibold" style={styles.name}>
          {item.name}
        </Text>
        <Text
          numberOfLines={1}
          variant="caption"
          weight="medium"
          color="foregroundDisabled"
          style={styles.time}
        >
          {item.startTime} - {item.endTime}
        </Text>
      </View>

      {item.canCreateHandoff && (
        <Pressable
          accessibilityLabel={`${item.name}님에게 인수인계 작성`}
          accessibilityRole="button"
          hitSlop={6}
          onPress={handlePress}
          style={({ pressed }) => [styles.touchTarget, pressed && styles.pressed]}
        >
          <View style={[styles.buttonVisual, { backgroundColor: theme.colors.surfaceBlueDefault }]}>
            <SendFill size={16} color="foregroundBlueSoft" />
            <Text variant="bodySmall" weight="semibold" color="foregroundBlueDefault">
              인수인계
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  employee: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profile: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  name: {
    maxWidth: 72,
  },
  time: {
    flexShrink: 1,
    fontVariant: ['tabular-nums'],
  },
  touchTarget: {
    minWidth: 92,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Figma node 1095:31306의 32px rounded action은 공용 Button에 없는 크기다.
  buttonVisual: {
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pressed: { opacity: 0.65 },
});
