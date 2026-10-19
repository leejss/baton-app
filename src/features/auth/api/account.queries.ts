import { queryOptions } from '@tanstack/react-query';

import { fetchMyProfile } from '@/features/auth/api/account.api';

/** 세션의 로그인 당시 스냅샷과 별도로 서버의 현재 프로필을 조회한다. */
export const accountQueries = {
  all: () => ['account'] as const,

  me: () =>
    queryOptions({
      queryKey: [...accountQueries.all(), 'me'] as const,
      queryFn: ({ signal }) => fetchMyProfile(signal),
    }),
};
