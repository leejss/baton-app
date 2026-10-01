import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { logger } from '@/shared/lib/logger';

import { useAuthStore } from '@/features/auth/store/authStore';
import { leaveStore } from '@/features/stores/api/store.api';
import { storeQueries } from '@/features/stores/api/store.queries';
import { hasPendingMembershipEnd } from '@/features/stores/lib/membership';

/**
 * 비활성 매장에 소속만 남아 있으면 소속 종료를 이어서 처리한다.
 *
 * 이 상태의 사용자는 활성 매장 게이트에 막혀 설정의 매장 나가기로 돌아갈 수 없고,
 * 새 매장을 만들거나 참여하려 해도 "이미 소속된 매장"으로 거절된다. 매장 참여·생성
 * 선택 화면에 들어온 시점에 한 번만 시도하고, 실패하면 반복하지 않고 로그로 남긴다.
 */
export function useEndInactiveMembership(enabled = true) {
  const queryClient = useQueryClient();
  const isSignedIn = useAuthStore((state) => state.status === 'signedIn');
  const myStore = useQuery({ ...storeQueries.me(), enabled: isSignedIn && enabled, staleTime: 0 });
  const membership = myStore.data?.membership;
  const pendingStoreId = hasPendingMembershipEnd(membership) ? membership.store.id : null;

  const endMembership = useMutation({
    mutationFn: (storeId: number) => leaveStore(storeId),
    onMutate: () => useAuthStore.getState().session?.user.id,
    onSuccess: async (_data, _storeId, userId) => {
      if (userId !== useAuthStore.getState().session?.user.id) return;
      await queryClient.cancelQueries({ queryKey: storeQueries.me().queryKey, exact: true });
      if (userId === useAuthStore.getState().session?.user.id)
        queryClient.setQueryData(storeQueries.me().queryKey, { membership: null });
    },
    onError: (error) => logger.warn('비활성 매장 소속 종료 실패', error),
  });
  const { mutate, isIdle } = endMembership;

  useEffect(() => {
    if (
      isSignedIn &&
      enabled &&
      !myStore.isFetching &&
      !myStore.isError &&
      pendingStoreId !== null &&
      isIdle
    )
      mutate(pendingStoreId);
  }, [isSignedIn, enabled, myStore.isFetching, myStore.isError, pendingStoreId, isIdle, mutate]);

  return {
    membership,
    isPending: myStore.isPending || myStore.isFetching || pendingStoreId !== null,
    error: myStore.error ?? (pendingStoreId !== null ? endMembership.error : null),
    retry: () => {
      if (!myStore.isError && pendingStoreId !== null && endMembership.isError)
        mutate(pendingStoreId);
      else void myStore.refetch();
    },
  };
}
