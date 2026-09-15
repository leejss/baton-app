import { logger } from '@/shared/lib/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  deactivateStore,
  fetchMembers,
  fetchMyStore,
  leaveStore,
  transferManager,
} from '@/features/stores/api/store.api';
import { hasTransferCandidates } from '@/features/settings/lib/departure';
import { AppError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/lib/routes';

/** 화면 진입 후 역할이 바뀔 수 있어 확정 시 최신 소속과 구성원을 다시 확인한다. */
export async function leaveCurrentStore(storeId: number, userId: number) {
  const { membership } = await fetchMyStore();
  if (!membership || membership.store.id !== storeId || membership.status !== 'ACTIVE') {
    throw new AppError(
      'server',
      '현재 매장 소속을 확인할 수 없어요. 마이페이지로 돌아가 다시 확인해주세요.',
    );
  }
  if (membership.role === 'EMPLOYEE') return leaveStore(storeId);
  /**
   * 승계할 직원이 없는 유일 관리자는 매장을 비활성화한 **뒤 소속을 종료**한다(requirements §6.2).
   * 비활성화만 하고 멈추면 소속이 활성으로 남아 새 매장 생성·참여가 `STORE_ALREADY_JOINED`로 막힌다.
   * 앞 단계는 되돌리지 않으므로, 이미 비활성화된 매장이면 소속 종료만 이어서 재시도한다.
   */
  if (membership.store.status === 'ACTIVE') {
    const members = await fetchMembers(storeId);
    if (hasTransferCandidates(members, userId)) {
      throw new AppError('server', '관리자 권한을 먼저 넘겨주세요.', {
        errorCode: 'MANAGER_TRANSFER_REQUIRED',
        status: 409,
      });
    }
    await deactivateStore(storeId);
  }
  return leaveStore(storeId);
}

export function useLeaveCurrentStore(storeId: number, userId: number) {
  const client = useQueryClient();
  return useMutation({
    onError: (error) => {
      logger.error('매장 소속 종료 실패', error);
    },
    mutationFn: () => leaveCurrentStore(storeId, userId),
    onSuccess: async () => {
      logger.info('매장 소속 종료 완료');
      await client.cancelQueries();
      await client.invalidateQueries({ refetchType: 'none' });
      router.replace(ROUTES.settings.result('left'));
    },
  });
}

export function useTransferManager(storeId: number, onTransferred: () => void) {
  const client = useQueryClient();
  return useMutation({
    onError: (error) => {
      logger.error('관리자 권한 이전 실패', error);
    },
    mutationFn: (userId: number) => transferManager(storeId, userId),
    onSuccess: async () => {
      logger.info('관리자 권한 이전 완료');
      onTransferred();
      await client.invalidateQueries();
    },
  });
}
