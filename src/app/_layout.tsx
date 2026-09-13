import { SessionQueryProvider } from '@/shared/providers/SessionQueryProvider';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { ForcedLogoutModal } from '@/features/auth/components/ForcedLogoutModal';
import { useAuthStore } from '@/features/auth/store/authStore';
import { reportError } from '@/shared/lib/reportError';
import { ErrorState } from '@/shared/ui/ErrorState';
import { SplashOverlay } from '@/shared/ui/SplashOverlay';

void SplashScreen.preventAutoHideAsync().catch(reportError);

/** Expo Router가 라우트 트리에서 발생한 렌더 에러를 잡을 때 쓰는 컴포넌트. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  useEffect(() => {
    reportError(error);
  }, [error]);
  return <ErrorState error={error} onRetry={retry} />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const authStatus = useAuthStore((state) => state.status);
  const restoreSession = useAuthStore((state) => state.restore);

  useEffect(() => {
    // 앱 시작 시 한 번. 끝날 때까지 스플래시가 화면을 덮고 있어 깜빡임이 없다.
    void restoreSession().catch(reportError);
  }, [restoreSession]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <SessionQueryProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(main)" />
              <Stack.Screen name="(store-onboarding)" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <SplashOverlay isReady={authStatus !== 'restoring'} />
            {/* 어느 화면에 있든 위에 떠야 해서 라우트 트리 바깥에 둔다. */}
            <ForcedLogoutModal />
          </ThemeProvider>
        </SessionQueryProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
