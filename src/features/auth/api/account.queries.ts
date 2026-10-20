import { queryOptions } from '@tanstack/react-query';

import { fetchMyProfile } from '@/features/auth/api/account.api';

export const accountQueries = {
  me: () =>
    queryOptions({
      queryKey: ['account', 'me'] as const,
      queryFn: ({ signal }) => fetchMyProfile(signal),
    }),
};
