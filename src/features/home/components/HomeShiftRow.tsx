import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { getProfileImageSource } from '@/shared/ui/profileImageAssets';
import type { HomeShiftItem } from '@/features/home/types';
import { Text } from '@/shared/ui';
import { radius, spacing, useTheme } from '@/theme';

type HomeShiftRowProps = {
  item: HomeShiftItem;
};

export function HomeShiftRow({ item }: HomeShiftRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <View style={styles.employee}>
        <Image
          source={getProfileImageSource(item.profileImage)}
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
});
