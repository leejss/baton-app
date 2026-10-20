import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import type { ProfileImage } from '@/features/auth/api/auth.schema';
import { radius, useTheme } from '@/theme';
import { getProfileImageSource } from '@/shared/ui/profileImageAssets';
export function EmployeeAvatar({ profileImage }: { profileImage: ProfileImage }) {
  const { colors } = useTheme();
  return (
    <Image
      source={getProfileImageSource(profileImage)}
      contentFit="cover"
      accessible={false}
      style={[styles.image, { width: 24, height: 24, borderColor: colors.borderSubtle }]}
    />
  );
}
const styles = StyleSheet.create({ image: { borderRadius: radius.full, borderWidth: 1 } });
