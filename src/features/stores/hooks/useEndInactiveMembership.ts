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
export function useEndInactiveMembership() {
  const queryClient = useQueryClient();
  const isSignedIn = useAuthStore((state) => state.status === 'signedIn');
  const myStore = useQuery({ ...storeQueries.me(), enabled: isSignedIn });
  const membership = myStore.data?.membership;
  const pendingStoreId = hasPendingMembershipEnd(membership) ? membership.store.id : null;

  const { mutate, isIdle } = useMutation({
    mutationFn: (storeId: number) => leaveStore(storeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storeQueries.all() }),
    onError: (error) => logger.warn('비활성 매장 소속 종료 실패', error),
  });

  useEffect(() => {
    if (pendingStoreId !== null && isIdle) mutate(pendingStoreId);
  }, [pendingStoreId, isIdle, mutate]);
}
