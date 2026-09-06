import type { ImageSource } from 'expo-image';

import type { HomeProfileImageKey } from '@/features/home/types';

const PROFILE_PLACEHOLDER = require('@/assets/images/home/profile-placeholder.png') as number;

/**
 * TODO(design-system): Figma node 91:1853에는 역할별 이미지가 없어 세 서버 키가 같은
 * placeholder를 사용한다. 역할별 원본이 정해지면 이 매핑만 교체한다.
 */
const PROFILE_IMAGE_SOURCES: Record<HomeProfileImageKey, ImageSource | number> = {
  DEFAULT_01: PROFILE_PLACEHOLDER,
  DEFAULT_MANAGER: PROFILE_PLACEHOLDER,
  DEFAULT_EMPLOYEE: PROFILE_PLACEHOLDER,
};

export function getHomeProfileImageSource(key: HomeProfileImageKey): ImageSource | number {
  return PROFILE_IMAGE_SOURCES[key];
}
