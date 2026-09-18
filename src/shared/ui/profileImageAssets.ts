import type { ImageSource } from 'expo-image';

import type { ProfileImage } from '@/features/auth/api/auth.schema';

/** 프로필 이미지 경로와 서버 키의 단일 기준. 화면에서는 이 모듈로만 이미지를 조회한다. */
const PROFILE_IMAGE_SOURCES = {
  DEFAULT_01: require('@/assets/images/profiles/default.png'),
  DEFAULT_MANAGER: require('@/assets/images/profiles/manager.png'),
  DEFAULT_EMPLOYEE: require('@/assets/images/profiles/employee.png'),
} satisfies Record<ProfileImage['key'], ImageSource | number>;

export function getProfileImageSource(key: ProfileImage['key']): ImageSource | number {
  return PROFILE_IMAGE_SOURCES[key];
}

/** 프로필 키 없이 역할만 보유한 화면 모델에서 사용한다. */
export function getRoleProfileImageSource(role: 'MANAGER' | 'EMPLOYEE'): ImageSource | number {
  return getProfileImageSource(role === 'MANAGER' ? 'DEFAULT_MANAGER' : 'DEFAULT_EMPLOYEE');
}
