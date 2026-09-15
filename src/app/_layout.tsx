import { SessionQueryProvider } from '@/shared/providers/SessionQueryProvider';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
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
          <ThemeProvider value={DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(main)" />
              <Stack.Screen name="(store-onboarding)" />
              <Stack.Screen name="+not-found" />
            </Stack>
            {/* 어느 화면에 있든 위에 떠야 해서 라우트 트리 바깥에 둔다. */}
            <ForcedLogoutModal />
          </ThemeProvider>
        </SessionQueryProvider>
        {/*
         * SessionQueryProvider는 로그인·로그아웃마다 key로 안쪽을 새로 만든다. 스플래시가 그 안에 있으면
         * 다시 나타났다가 Android에서 사라지지 않는다. 앱 시작 때 한 번만 쓰도록 바깥에 둔다.
         */}
        <SplashOverlay isReady={authStatus !== 'restoring'} />
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
