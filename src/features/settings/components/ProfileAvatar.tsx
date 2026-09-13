import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { UserProfile } from '@/features/auth/api/auth.schema';
import { ILLUSTRATION_ASSETS } from '@/shared/ui';
import { radius, useTheme } from '@/theme';

type ProfileAvatarProps = { profileImage: UserProfile['profileImage']; size?: number };

export function ProfileAvatar({ profileImage, size = 36 }: ProfileAvatarProps) {
  const { colors } = useTheme();
  const asset =
    profileImage.key === 'DEFAULT_MANAGER'
      ? ILLUSTRATION_ASSETS.manager
      : ILLUSTRATION_ASSETS.worker;
  return (
    <View
      style={[
        styles.root,
        { width: size, height: size, backgroundColor: colors.surfaceNeutralSubtle },
      ]}
    >
      <Image
        source={asset.source}
        contentFit="contain"
        accessible={false}
        style={{ width: size * 0.8, height: size * 0.8 }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
