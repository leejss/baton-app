import { useMutation, useQueryClient } from '@tanstack/react-query';

import { normalizeError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';

import { updateDisplayName, withdraw } from '@/features/auth/api/account.api';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * 이름 변경 후 프로필·홈·구성원 등 사용자명을 표시하는 서버 데이터를 다시 조회한다.
 */
export function useUpdateDisplayName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayName: string) => updateDisplayName(displayName),
    onSuccess: () => queryClient.invalidateQueries(),
    onError: (error) => {
      // 이름은 개인정보라 싣지 않는다. 실패 종류만 남긴다.
      logger.warn('이름 변경 실패', { code: normalizeError(error).code });
    },
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
    mutationFn: () => withdraw(),
    onSuccess: async () => {
      await queryClient.cancelQueries();
      await signOut('withdrawn');
      queryClient.clear();
    },
    onError: (error) => {
      logger.warn('회원 탈퇴 실패', { code: normalizeError(error).code });
    },
  });
}
