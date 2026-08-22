import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState, type AppStateStatus } from 'react-native';

import { isAppError } from '@/shared/api/errors';

const RETRYABLE_ATTEMPTS = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        // RN에서는 창 포커스 개념이 없으므로 focusManager가 AppState를 대신 알린다.
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          // 취소는 재시도 대상이 아니다.
          // 4xx 미재시도 규칙은 HTTP 상태를 아는 API 레이어가 생긴 뒤 추가한다.
          if (isAppError(error) && error.code === 'canceled') {
            return false;
          }
          return failureCount < RETRYABLE_ATTEMPTS;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * 앱 시작 시 한 번 호출한다. 반환된 함수로 구독을 해제한다.
 */
export function bindQueryManagers(): () => void {
  const networkSubscription = Network.addNetworkStateListener((state) => {
    // isInternetReachable을 우선 신뢰하고, 미지원 플랫폼에서는 isConnected로 대체한다.
    onlineManager.setOnline(state.isInternetReachable ?? state.isConnected ?? true);
  });

  const appStateSubscription = AppState.addEventListener('change', (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  });

  return () => {
    networkSubscription.remove();
    appStateSubscription.remove();
  };
}
