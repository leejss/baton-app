import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { createQueryClient } from '@/shared/api/queryClient';
import { logger } from '@/shared/lib/logger';
import { ErrorState } from '@/shared/ui/ErrorState';
import { SplashOverlay } from '@/shared/ui/SplashOverlay';

SplashScreen.preventAutoHideAsync();

const queryClient = createQueryClient();

/** Expo Router가 라우트 트리에서 발생한 렌더 에러를 잡을 때 쓰는 컴포넌트. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return <ErrorState error={error} onRetry={retry} />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // 백그라운드 전환 시 버퍼된 원격 로그를 내보낸다. 안 하면 종료 시 유실된다.
    const appStateSubscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') {
        void logger.flush();
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(main)" />
              <Stack.Screen name="(store-onboarding)" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <SplashOverlay />
          </ThemeProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
