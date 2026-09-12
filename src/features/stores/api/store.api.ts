import { del, get, post, postVoid } from '@/shared/api/client';
import {
  invitationCodeSchema,
  memberSchema,
  myStoreSchema,
  storeContextSchema,
  storeInvitationPreviewSchema,
  type CreateStoreParams,
  type InvitationCode,
  type StoreContext,
  type StoreInvitationPreview,
} from '@/features/stores/api/store.schema';

export const fetchMyStore = (signal?: AbortSignal) => get('/stores/me', myStoreSchema, { signal });
export const fetchMembers = (storeId: number, signal?: AbortSignal) =>
  get(`/stores/${storeId}/members`, memberSchema.array(), { signal });

export const searchMembers = (storeId: number, query: string, signal?: AbortSignal) =>
  get(`/stores/${storeId}/members?query=${encodeURIComponent(query)}`, memberSchema.array(), {
    signal,
  });

export const leaveStore = (storeId: number) => del(`/stores/${storeId}/members/me`);
export const deactivateStore = (storeId: number) =>
  postVoid(`/stores/${storeId}/deactivate`, undefined);
export const transferManager = (storeId: number, userId: number) =>
  postVoid(`/stores/${storeId}/manager-transfer`, { userId });

/**
 * 매장 생성(STORE-07). 생성자는 관리자가 되고 **최초 초대 코드가 함께 발급**된다.
 * 코드 발급만 실패해도 매장·멤버십은 만들어지므로 응답의 `invitationCodeIssueStatus`를 봐야 한다.
 */
export const createStore = (
  params: CreateStoreParams,
  signal?: AbortSignal,
): Promise<StoreContext> => post('/stores', params, storeContextSchema, { signal });

/** 초대 코드로 참여할 매장 미리보기(STORE-02·03). 코드가 무효면 `404 STORE_INVITATION_INVALID`. */
export const previewStoreInvitation = (
  invitationCode: string,
  signal?: AbortSignal,
): Promise<StoreInvitationPreview> =>
  post('/stores/join/preview', { invitationCode }, storeInvitationPreviewSchema, { signal });

/**
 * 매장 참여 확정(STORE-04). 직원 멤버십이 생긴다.
 *
 * 미리보기와 참여가 분리돼 있어 **확인 화면에 머무는 동안 코드가 만료·폐기될 수 있다**.
 * 참여 요청의 실패는 예외가 아니라 정상 시나리오로 다룬다.
 */
export const joinStore = (invitationCode: string, signal?: AbortSignal): Promise<StoreContext> =>
  post('/stores/join', { invitationCode }, storeContextSchema, { signal });

/**
 * 현재 유효한 초대 코드 조회(INV-01). 관리자만 호출할 수 있다.
 *
 * ⚠️ 유효한 코드가 없으면 **`200`이면서 `data`가 `null`**이다. 오류가 아니다
 * (`api-spec.md` §3). 클라이언트는 `null`을 "코드 없음"으로 그린다.
 */
export const fetchInvitationCode = (
  storeId: number,
  signal?: AbortSignal,
): Promise<InvitationCode | null> =>
  get(`/stores/${storeId}/invitation-code`, invitationCodeSchema.nullable(), { signal });

/**
 * 초대 코드 재발급(INV-02). **교체 확인 UI를 거친 뒤에만** 호출한다 —
 * 기존 코드는 이 요청으로 폐기된다. 발급에 실패하면 기존 코드가 그대로 유지된다.
 */
export const issueInvitationCode = (
  storeId: number,
  signal?: AbortSignal,
): Promise<InvitationCode> =>
  post(`/stores/${storeId}/invitation-code`, { replaceCurrent: true }, invitationCodeSchema, {
    signal,
  });
