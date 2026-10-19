import { useEffect, useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useStoreJoinStore } from '@/features/stores/store/storeJoinStore';
import { previewStoreInvitation } from '@/features/stores/api/store.api';
import { StoreJoinConfirmScreen } from '@/features/stores/screens/StoreJoinConfirmScreen';
import { Button, Text } from '@/shared/ui';
import { normalizeError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/lib/routes';
import { reportError } from '@/shared/lib/reportError';
export default function WorkspaceInvitationRoute() {
  const params = useLocalSearchParams<{ token?: string }>();
  const incoming = typeof params.token === 'string' ? params.token : null;
  const status = useAuthStore((state) => state.status);
  const { token, preview, hydrated } = useStoreJoinStore();
  const [error, setError] = useState<unknown>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!incoming || !/^[A-Za-z0-9_-]+$/.test(incoming)) return;
    if (token !== incoming) void useStoreJoinStore.getState().setToken(incoming).catch(setError);
  }, [incoming]);
  useEffect(() => {
    if (status !== 'signedIn' || !token || (incoming && incoming !== token)) return;
    const controller = new AbortController();
    setError(undefined);
    void previewStoreInvitation(token, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) useStoreJoinStore.getState().setPreview(result);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure);
      });
    return () => controller.abort();
  }, [status, token, incoming, retry]);
  const finish = () => {
    void useStoreJoinStore.getState().clear().catch(reportError);
    router.replace(ROUTES.home);
  };
  if (incoming && !/^[A-Za-z0-9_-]+$/.test(incoming))
    return (
      <View style={{ flex: 1, padding: 24, gap: 16 }}>
        <Text>초대 링크를 확인해주세요.</Text>
        <Button label="닫기" onPress={finish} />
      </View>
    );
  if (status === 'restoring' || !hydrated || (incoming && incoming !== token))
    return <ActivityIndicator />;
  if (status === 'signedOut') return <Redirect href={ROUTES.auth.start} />;
  if (!token || error)
    return (
      <View style={{ flex: 1, padding: 24, gap: 16 }}>
        <Text>{error ? normalizeError(error).message : '초대 링크를 확인해주세요.'}</Text>
        {error ? <Button label="다시 확인" onPress={() => setRetry((value) => value + 1)} /> : null}
        <Button label="닫기" onPress={finish} />
      </View>
    );
  if (!preview) return <ActivityIndicator />;
  return (
    <StoreJoinConfirmScreen
      preview={preview}
      token={token}
      onBack={finish}
      onJoined={() => {
        void useStoreJoinStore.getState().clear().catch(reportError);
        router.replace(ROUTES.storeJoin.complete);
      }}
      onInvitationExpired={finish}
    />
  );
}
