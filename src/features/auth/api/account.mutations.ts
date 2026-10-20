import { logger } from '@/shared/lib/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateDisplayName, withdraw } from '@/features/auth/api/account.api';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useUpdateDisplayName() {
  const queryClient = useQueryClient();

  return useMutation({
    onError: (error) => {
      logger.error('이름 변경 실패', error);
    },
    mutationFn: (displayName: string) => updateDisplayName(displayName),
    onSuccess: () => {
      logger.info('이름 변경 완료');
      return queryClient.invalidateQueries();
    },
  });
}

export function useSignOut() {
  const signOut = useAuthStore((state) => state.signOut);

  return useMutation({
    onError: (error) => {
      logger.error('로그아웃 실패', error);
    },
    mutationFn: () => signOut(),
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  const signOut = useAuthStore((state) => state.signOut);

  return useMutation({
    onError: (error) => {
      logger.error('회원 탈퇴 실패', error);
    },
    mutationFn: () => withdraw(),
    onSuccess: async () => {
      logger.info('회원 탈퇴 완료');
      await queryClient.cancelQueries();
      await signOut('withdrawn');
      queryClient.clear();
    },
  });
}
