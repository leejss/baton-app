import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        // 에러 종류별 재시도 규칙(4xx 제외, 취소 제외)은
        // HTTP 상태를 아는 API 레이어가 생긴 뒤 추가한다.
        retry: 2,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
