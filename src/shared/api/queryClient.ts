import {
  QueryClient,
  QueryCache,
  MutationCache,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import * as Network from "expo-network";
import { AppState } from "react-native";
import { isAppError, normalizeError } from "@/shared/api/errors";
import { logger } from "@/shared/lib/logger";

export function logApiFailure(error: unknown, operation: string): void {
  const normalized = normalizeError(error);
  if (normalized.code === "canceled") return;
  const attributes = {
    operation,
    code: normalized.code,
    status: normalized.status,
    errorCode: normalized.errorCode,
  };
  if (normalized.errorCode === "SCHEDULE_DUPLICATES_REQUIRE_CONFIRMATION") {
    logger.info("중복 일정 확인이 필요합니다", attributes);
  } else {
    logger.error("API 작업 실패", attributes);
  }
}
export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
): boolean {
  return (
    failureCount < 2 &&
    isAppError(error) &&
    (error.code === "network" ||
      error.code === "timeout" ||
      (error.code === "server" && (error.status ?? 0) >= 500))
  );
}
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) =>
        logApiFailure(
          error,
          String(
            query.meta?.operation ??
              query.queryKey
                .filter((part) => typeof part === "string")
                .slice(0, 3)
                .join("."),
          ),
        ),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        logApiFailure(
          error,
          String(
            mutation.meta?.operation ??
              mutation.options.mutationKey?.join(".") ??
              "mutation",
          ),
        ),
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
  focusManager.setFocused(AppState.currentState === "active");
  const appState = AppState.addEventListener("change", (state) =>
    focusManager.setFocused(state === "active"),
  );
  let disposed = false;
  let receivedEvent = false;
  const update = (state: Network.NetworkState) =>
    onlineManager.setOnline(
      state.isConnected !== false && state.isInternetReachable !== false,
    );
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
