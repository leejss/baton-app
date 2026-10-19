import { delWithBody, get, patch } from '@/shared/api/client';

import { userProfileSchema, type UserProfile } from '@/features/auth/api/auth.schema';

/**
 * 내 계정 API. 경로·필드는 실서버 스펙(`/v3/api-docs`)과 wiki `api-list.md` §2를 따른다.
 * 전부 인증이 필요하므로 `auth` 옵션을 건드리지 않는다(기본값이 토큰 주입).
 *
 *   GET    /users/me   내 정보 조회
 *   PATCH  /users/me   이름 변경
 *   DELETE /users/me   회원 탈퇴
 */

/** 내 정보 조회. 세션 복원 후 서버 기준으로 프로필을 맞출 때 쓴다. */
export function fetchMyProfile(signal?: AbortSignal): Promise<UserProfile> {
  return get('/users/me', userProfileSchema, { signal });
}

/** 닉네임 변경. 사진은 별도의 profile-image 경로로 변경한다. */
export function updateDisplayName(displayName: string, signal?: AbortSignal): Promise<UserProfile> {
  return patch('/users/me', { displayName }, userProfileSchema, { signal });
}

/**
 * 회원 탈퇴. 되돌릴 수 없다.
 *
 * `impactAcknowledged`는 "영향 안내를 읽고 동의했다"는 표시이고 계약상 필수다.
 * 화면이 영향(일정·인수인계·첨부·알림이 함께 삭제됨)을 보여준 뒤에만 `true`로 부른다.
 *
 * 참여한 공간 중 다른 멤버가 남는 유일 관리자 공간이 있으면
 * `409 MANAGER_TRANSFER_REQUIRED`와 data.workspaceId로 권한 이전을 요구한다.
 */
export function withdraw(signal?: AbortSignal): Promise<void> {
  return delWithBody('/users/me', { impactAcknowledged: true }, { signal });
}

/** 검증 완료된 본인 PROFILE 파일을 연결하거나 기본 사진으로 되돌린다. */
export function updateProfileImage(
  attachmentId: number | null,
  signal?: AbortSignal,
): Promise<UserProfile> {
  return patch('/users/me/profile-image', { attachmentId }, userProfileSchema, { signal });
}
