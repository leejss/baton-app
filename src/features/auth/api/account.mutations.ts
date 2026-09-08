import { useMutation, useQueryClient } from '@tanstack/react-query';

import { normalizeError, type AppError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';

import { updateDisplayName, withdraw } from '@/features/auth/api/account.api';
import { accountQueries } from '@/features/auth/api/account.queries';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * 유일한 관리자인 매장이 남아 있어 탈퇴가 거절된 경우.
 * 화면은 "매장을 먼저 비활성화하거나 관리자를 넘기라"고 안내해야 한다.
 */
export function isWithdrawBlockedByStore(error: unknown): boolean {
  const appError = normalizeError(error) as AppError;
  return appError.status === 409;
}

/**
 * 이름 변경. 성공하면 스토어의 세션 사용자 정보도 함께 갱신한다 —
 * 서버 응답만 캐시에 넣고 스토어를 두면 화면마다 다른 이름이 보인다.
 */
export function useUpdateDisplayName() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: (displayName: string) => updateDisplayName(displayName),
    onSuccess: async (user) => {
      if (session !== null) {
        await signIn({ ...session, user });
      }
      await queryClient.invalidateQueries({ queryKey: accountQueries.all() });
    },
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
 * 이미 없는 계정이라 401이 날 뿐이고, `signOut`이 그 실패를 삼키긴 하지만
 * 불필요한 요청이다. 저장된 세션만 지우는 것으로 충분하다.
 */
export function useWithdraw() {
  const queryClient = useQueryClient();
  const signOut = useAuthStore((state) => state.signOut);

  return useMutation({
    mutationFn: () => withdraw(),
    onSuccess: async () => {
      await signOut();
      queryClient.clear();
    },
    onError: (error) => {
      logger.warn('회원 탈퇴 실패', { code: normalizeError(error).code });
    },
  });
}
