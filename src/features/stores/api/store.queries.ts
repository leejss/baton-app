import { queryOptions } from '@tanstack/react-query';
import { fetchInvitationCode, fetchMembers, fetchMyStore } from '@/features/stores/api/store.api';

export const storeQueries = {
  all: () => ['stores'] as const,
  me: () =>
    queryOptions({
      queryKey: ['stores', 'me'] as const,
      queryFn: ({ signal }) => fetchMyStore(signal),
    }),
  members: (storeId: number) =>
    queryOptions({
      queryKey: ['stores', storeId, 'members'] as const,
      queryFn: ({ signal }) => fetchMembers(storeId, signal),
      enabled: storeId > 0,
    }),
  /**
   * 현재 유효한 초대 코드(INV-01). 관리자 전용이고, 코드가 없으면 `null`이 온다.
   * 코드는 관리자 액션으로만 바뀌므로 폴링하지 않는다.
   */
  invitationCode: (storeId: number) =>
    queryOptions({
      queryKey: ['stores', storeId, 'invitation-code'] as const,
      queryFn: ({ signal }) => fetchInvitationCode(storeId, signal),
      enabled: storeId > 0,
    }),
};
