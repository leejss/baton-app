import { queryOptions } from '@tanstack/react-query';

import { fetchMyProfile } from '@/features/auth/api/account.api';

/**
 * 내 계정 쿼리. 세션(`authStore`)에 들어 있는 사용자 정보와 별개로,
 * **서버가 지금 뭐라고 하는지**가 필요한 화면이 쓴다.
 *
 * 세션의 사용자 정보는 로그인 시점의 스냅샷이다. 프로필 이미지는 활성 역할에서
 * 파생되는 값이라(ADR-027) 매장 참여·나가기·관리자 승계 뒤에 바뀌는데,
 * 그때 세션은 그대로다. 그런 화면은 이 쿼리를 봐야 한다.
 */
export const accountQueries = {
  all: () => ['account'] as const,

  me: () =>
    queryOptions({
      queryKey: [...accountQueries.all(), 'me'] as const,
      queryFn: ({ signal }) => fetchMyProfile(signal),
    }),
};
