import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useStoreCreateStore } from '@/features/stores/store/storeCreateStore';
import { useStoreJoinStore } from '@/features/stores/store/storeJoinStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useHandoffDraftStore } from '@/features/handoffs/store/handoffDraftStore';
import { abortWorkspaceRequests } from '@/shared/api/client';
import { createQueryClient, subscribeQueryEnvironment } from '@/shared/api/queryClient';

export function SessionQueryProvider({ children }: { children: ReactNode }) {
  const identity = useAuthStore((state) =>
    state.status === 'signedIn' ? String(state.session.user.id) : state.status,
  );
  useEffect(subscribeQueryEnvironment, []);
  return <QuerySession key={identity}>{children}</QuerySession>;
}
function QuerySession({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      if (
        state.session?.user.id !== previous.session?.user.id ||
        state.status !== previous.status
      ) {
        abortWorkspaceRequests();
        void client.cancelQueries();
        client.clear();
        useHandoffDraftStore.getState().reset();
        useStoreCreateStore.getState().clear();
        useStoreJoinStore.setState({ preview: null });
      }
    });
    return () => {
      unsubscribe();
      void client.cancelQueries();
      client.clear();
    };
  }, [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
