import { Image } from 'expo-image';
import { StyleSheet, type StyleProp, type ImageStyle } from 'react-native';
import type { ProfileImage } from '@/features/auth/api/auth.schema';
import { getProfileImageSource } from '@/shared/ui/profileImageAssets';

type HandoffAvatarProps = {
  profileImage: ProfileImage;
  style?: StyleProp<ImageStyle>;
};

export function HandoffAvatar({ profileImage, style }: HandoffAvatarProps) {
  return (
    <Image
      source={getProfileImageSource(profileImage.key)}
      contentFit="cover"
      accessible={false}
      style={[styles.root, style]}
    />
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): 프로필 아바타의 44px 크기를 아이콘·아바타 토큰에 동기화한다.
  root: {
    width: 44,
    height: 44,
    borderRadius: 999,
  },
});
