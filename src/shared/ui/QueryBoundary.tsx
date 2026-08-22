import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Suspense, type ReactNode } from 'react';

import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useTheme } from '@/theme';

type QueryBoundaryProps = {
  children: ReactNode;
  /** 로딩 중에 그릴 UI. 스켈레톤을 넘기는 것을 권장한다. */
  pendingFallback?: ReactNode;
  resetKey?: unknown;
};

/**
 * 화면마다 로딩/에러 UI를 새로 만들지 않기 위한 공용 경계.
 * `useSuspenseQuery`와 함께 쓴다.
 */
export function QueryBoundary({ children, pendingFallback, resetKey }: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          resetKey={resetKey}
          fallback={({ error, reset: resetBoundary }) => (
            <ErrorState
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

  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
