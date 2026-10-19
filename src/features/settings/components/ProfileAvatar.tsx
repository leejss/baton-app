import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { UserProfile } from '@/features/auth/api/auth.schema';
import { getProfileImageSource } from '@/shared/ui/profileImageAssets';
import { radius, useTheme } from '@/theme';

type ProfileAvatarProps = { profileImage: UserProfile['profileImage']; size?: number };

export function ProfileAvatar({ profileImage, size = 36 }: ProfileAvatarProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.root,
        { width: size, height: size, backgroundColor: colors.surfaceNeutralSubtle },
      ]}
    >
      <Image
        source={getProfileImageSource(profileImage)}
        contentFit="cover"
        accessible={false}
        style={styles.image}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  root: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
