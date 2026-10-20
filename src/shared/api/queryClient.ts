import {
  QueryClient,
  QueryCache,
  MutationCache,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState } from 'react-native';
import { isAppError } from '@/shared/api/errors';
import { reportError } from '@/shared/lib/reportError';

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  return (
    failureCount < 2 &&
    isAppError(error) &&
    (error.code === 'network' ||
      error.code === 'timeout' ||
      (error.code === 'server' && (error.status ?? 0) >= 500))
  );
}
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => reportError(error),
    }),
    mutationCache: new MutationCache({
      // 개별 onError의 메시지가 먼저 기록되도록 마지막에 기본 보고를 한다.
      // 이미 logger로 기록한 오류는 공통 중복 제거가 걸러준다.
      onSettled: (_data, error) => {
        if (error !== null) reportError(error);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetryQuery,
      },
      mutations: { retry: false },
    },
  });
}
export function subscribeQueryEnvironment(): () => void {
  focusManager.setFocused(AppState.currentState === 'active');
  const appState = AppState.addEventListener('change', (state) =>
    focusManager.setFocused(state === 'active'),
  );
  let disposed = false;
  let receivedEvent = false;
  const update = (state: Network.NetworkState) =>
    onlineManager.setOnline(state.isConnected !== false && state.isInternetReachable !== false);
  const network = Network.addNetworkStateListener((state) => {
    receivedEvent = true;
    update(state);
  });
  void Network.getNetworkStateAsync()
    .then((state) => {
      if (!disposed && !receivedEvent) update(state);
    })
    .catch(() => {
      /* 알 수 없는 상태는 기존 연결 상태를 유지한다. */
    });
  return () => {
    disposed = true;
    appState.remove();
    network.remove();
  };
}
