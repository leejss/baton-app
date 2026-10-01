import { useQueryClient } from '@tanstack/react-query';

import { storeQueries } from '@/features/stores/api/store.queries';
import { logger } from '@/shared/lib/logger';

/** 성공 응답을 받지 못한 경우에도 서버의 최신 소속을 확인한다. */
export function useStoreMembershipRecovery() {
  const queryClient = useQueryClient();

  return async () => {
    const { membership } = await queryClient.fetchQuery({ ...storeQueries.me(), staleTime: 0 });
    if (membership?.status !== 'ACTIVE') return false;
    logger.info('기존 매장 소속 확인 완료', { store_id: membership.store.id });
    return true;
  };
}
