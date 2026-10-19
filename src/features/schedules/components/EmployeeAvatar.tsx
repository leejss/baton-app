import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import type { ProfileImage } from '@/features/auth/api/auth.schema';
import { radius, useTheme } from '@/theme';
import { getProfileImageSource } from '@/shared/ui/profileImageAssets';
export function EmployeeAvatar({
  profileImage,
  size = 24,
}: {
  profileImage: ProfileImage;
  size?: 24 | 34;
}) {
  const { colors } = useTheme();
  return (
    <Image
      source={getProfileImageSource(profileImage)}
      contentFit="cover"
      accessible={false}
      style={[styles.image, { width: size, height: size, borderColor: colors.borderSubtle }]}
    />
  );
}
const styles = StyleSheet.create({ image: { borderRadius: radius.full, borderWidth: 1 } });
