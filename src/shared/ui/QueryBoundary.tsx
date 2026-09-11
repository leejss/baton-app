import { Text } from '@/shared/ui/Text';
import { QueryErrorResetBoundary, onlineManager } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Suspense, useSyncExternalStore, type ReactNode } from 'react';

import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useTheme } from '@/theme';

type QueryBoundaryProps = {
  children: ReactNode;
  query?: {
    data: unknown;
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => Promise<unknown>;
  };

  /** 로딩 중에 그릴 UI. 스켈레톤을 넘기는 것을 권장한다. */
  pendingFallback?: ReactNode;
  resetKey?: unknown;
  onBack?: () => void;
};

/**
 * 화면마다 로딩/에러 UI를 새로 만들지 않기 위한 공용 경계.
 * `useSuspenseQuery`와 함께 쓴다.
 */
export function QueryBoundary({
  children,
  pendingFallback,
  resetKey,
  query,
  onBack,
}: QueryBoundaryProps) {
  if (query && query.data === undefined) {
    if (query.isError)
      return (
        <ErrorState onBack={onBack} error={query.error} onRetry={() => void query.refetch()} />
      );
    if (query.isPending) return <>{pendingFallback ?? <PendingFallback />}</>;
  }
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          resetKey={resetKey}
          fallback={({ error, reset: resetBoundary }) => (
            <ErrorState
              onBack={onBack}
              error={error}
              onRetry={() => {
                reset();
                resetBoundary();
              }}
            />
          )}
        >
          <Suspense fallback={pendingFallback ?? <PendingFallback />}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

function PendingFallback() {
  const theme = useTheme();
  const online = useSyncExternalStore(
    onlineManager.subscribe.bind(onlineManager),
    onlineManager.isOnline.bind(onlineManager),
  );

  return (
    <View style={styles.container}>
      {online ? (
        <ActivityIndicator color={theme.colors.textSecondary} />
      ) : (
        <Text>네트워크 연결을 기다리고 있습니다.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
