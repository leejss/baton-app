import { logger } from '@/shared/lib/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateDisplayName, withdraw } from '@/features/auth/api/account.api';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * 이름 변경 후 프로필·홈·구성원 등 사용자명을 표시하는 서버 데이터를 다시 조회한다.
 */
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

/**
 * 사용자가 직접 하는 로그아웃. 서버가 401(세션 이미 끊김)이면 성공으로 처리한다.
 * 네트워크 등 다른 실패만 오류로 돌려주며, 이때는 세션이 남아 있다.
 */
export function useSignOut() {
  const signOut = useAuthStore((state) => state.signOut);

  return useMutation({
    onError: (error) => {
      logger.error('로그아웃 실패', error);
    },
    mutationFn: () => signOut(),
  });
}

/**
 * 회원 탈퇴. 되돌릴 수 없다.
 *
 * 성공하면 계정이 사라졌으므로 세션을 비운다. 이때 서버 로그아웃은 부르지 않는다 —
 * 이미 삭제된 계정에 불필요한 401 요청을 보내지 않고 로컬 세션만 정리한다.
 */
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
