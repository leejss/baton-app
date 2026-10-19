import type { ImageSource } from 'expo-image';
import type { ProfileImage } from '@/features/auth/api/auth.schema';
const PROFILE_IMAGE_SOURCES = {
  DEFAULT_01: require('@/assets/images/profiles/default.png'),
  DEFAULT_MANAGER: require('@/assets/images/profiles/manager.png'),
  DEFAULT_EMPLOYEE: require('@/assets/images/profiles/employee.png'),
};
export function getProfileImageSource(image: ProfileImage): ImageSource | number {
  return image.source === 'UPLOADED' ? { uri: image.url } : PROFILE_IMAGE_SOURCES[image.key];
}
