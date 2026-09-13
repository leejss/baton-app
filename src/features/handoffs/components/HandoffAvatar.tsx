import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui';
import { useTheme } from '@/theme';

type HandoffAvatarProps = {
  name: string;
};

export function HandoffAvatar({ name }: HandoffAvatarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.surfaceBlueDefault }]}>
      <Text variant="bodySmall" weight="semibold" color="foregroundBlueDefault">
        {name.slice(0, 1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): 프로필 아바타의 44px 크기를 아이콘·아바타 토큰에 동기화한다.
  root: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
