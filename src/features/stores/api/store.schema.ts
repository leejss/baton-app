import { z } from 'zod';
import { profileImageSchema } from '@/features/auth/api/auth.schema';

export const memberSchema = z.object({
  userId: z.number().int().positive(),
  email: z.email(),
  displayName: z.string(),
  profileImage: profileImageSchema,
  role: z.enum(['MANAGER', 'EMPLOYEE']),
  status: z.enum(['ACTIVE', 'LEFT']),
});
export const storeSchema = z.object({
  id: z.number().int().positive(),
  storeName: z.string(),
  branchName: z.string(),
  address: z.string(),
  detailAddress: z.string().nullish(),
  storeContact: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  createdAt: z.iso.datetime({ offset: true }),
  deactivatedAt: z.iso.datetime({ offset: true }).nullish(),
});
export const membershipSchema = z.object({
  store: storeSchema,
  role: z.enum(['MANAGER', 'EMPLOYEE']),
  status: z.enum(['ACTIVE', 'LEFT']),
});
export const myStoreSchema = z.object({
  membership: membershipSchema.nullish(),
});
export type MemberDto = z.infer<typeof memberSchema>;
export type Membership = z.infer<typeof membershipSchema>;

/**
 * 매장 초대 코드. 계약상 **숫자 4자리**이고 발급 후 24시간 유효하다
 * (`api-spec.md` §3 `InvitationCodeValue`).
 */
export const INVITATION_CODE_LENGTH = 4;
export const invitationCodeValueSchema = z.string().regex(/^[0-9]{4}$/);

export const invitationCodeSchema = z.object({
  code: invitationCodeValueSchema,
  expiresAt: z.iso.datetime({ offset: true }),
  status: z.enum(['ACTIVE', 'EXPIRED', 'REVOKED']),
});

/**
 * 매장 생성·참여 응답.
 *
 * `initialInvitationCode`는 **매장 생성 응답에서 최초 발급에 성공한 경우에만** 온다.
 * 코드 발급만 실패해도 매장과 멤버십은 만들어지므로(`invitationCodeIssueStatus`)
 * 화면은 코드 없는 완료 상태를 반드시 처리해야 한다.
 */
export const storeContextSchema = z.object({
  store: storeSchema,
  membership: membershipSchema,
  initialInvitationCode: invitationCodeSchema.nullish(),
  invitationCodeIssueStatus: z.enum(['ISSUED', 'ISSUE_FAILED']).nullish(),
});

/** `POST /stores/join/preview` 응답. 참여 확정 전 보여줄 매장 정보다. */
export const storeInvitationPreviewSchema = z.object({
  storeId: z.number().int().positive(),
  storeName: z.string(),
  branchName: z.string(),
  address: z.string(),
  detailAddress: z.string().nullish(),
  storeContact: z.string(),
  /**
   * 활성 관리자 이름. **서버가 마스킹한 값**(`김*현`)이라 앱에서 다시 가리지 않는다.
   * wiki `proposals/store-invitation-preview-manager-name.md`(Draft) 기준이며,
   * 서버 반영 전이거나 관리자를 확정할 수 없으면 `null`·생략이다.
   */
  managerName: z.string().nullish(),
  invitationCode: invitationCodeValueSchema,
  expiresAt: z.iso.datetime({ offset: true }),
});

export type Store = z.infer<typeof storeSchema>;
export type InvitationCode = z.infer<typeof invitationCodeSchema>;
export type StoreContext = z.infer<typeof storeContextSchema>;
export type StoreInvitationPreview = z.infer<typeof storeInvitationPreviewSchema>;

/**
 * 매장 생성 요청. 제약은 계약(`StoreCreateRequest`)을 따른다 —
 * 상세주소만 선택이고 나머지는 필수다.
 *
 * 요청 스키마라 선택 필드는 `.optional()`이다(응답의 `.nullish()`와 반대).
 */
export type CreateStoreParams = {
  storeName: string;
  branchName: string;
  address: string;
  detailAddress?: string;
  storeContact: string;
};
