import { delWithBody, get, patch } from '@/shared/api/client';

import { userProfileSchema } from '@/features/auth/api/auth.schema';

export function fetchMyProfile(signal?: AbortSignal) {
  return get('/users/me', userProfileSchema, { signal });
}

export function updateDisplayName(displayName: string, signal?: AbortSignal) {
  return patch('/users/me', { displayName }, userProfileSchema, { signal });
}

// 영향 안내에 동의한 화면에서만 호출한다.
export function withdraw(signal?: AbortSignal) {
  return delWithBody('/users/me', { impactAcknowledged: true }, { signal });
}

export function updateProfileImage(attachmentId: number | null, signal?: AbortSignal) {
  return patch('/users/me/profile-image', { attachmentId }, userProfileSchema, { signal });
}
