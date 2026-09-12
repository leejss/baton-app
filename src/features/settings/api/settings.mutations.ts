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
  const members = await fetchMembers(storeId);
  if (hasTransferCandidates(members, userId)) {
    throw new AppError('server', '관리자 권한을 먼저 넘겨주세요.', {
      errorCode: 'MANAGER_TRANSFER_REQUIRED',
      status: 409,
    });
  }
  return deactivateStore(storeId);
}

export function useLeaveCurrentStore(storeId: number, userId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => leaveCurrentStore(storeId, userId),
    onSuccess: async () => {
      await client.cancelQueries();
      await client.invalidateQueries({ refetchType: 'none' });
      router.replace(ROUTES.settings.result('left'));
    },
  });
}

export function useTransferManager(storeId: number, onTransferred: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => transferManager(storeId, userId),
    onSuccess: async () => {
      onTransferred();
      await client.invalidateQueries();
    },
  });
}
