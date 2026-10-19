import { useSuspenseQueries } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { abortWorkspaceRequests } from '@/shared/api/client';
import { useHandoffDraftStore } from '@/features/handoffs/store/handoffDraftStore';
import { ROUTES } from '@/shared/lib/routes';
import { accountQueries } from '@/features/auth/api/account.queries';
import { storeQueries } from '@/features/stores/api/store.queries';
import { MainContextProvider } from '@/features/stores/hooks/useMainContext';
import {
  selectedWorkspaceId,
  useWorkspaceSelectionStore,
} from '@/features/stores/store/workspaceSelectionStore';
export function ActiveStoreGate({ children }: { children: ReactNode }) {
  const [account, workspaces] = useSuspenseQueries({
    queries: [accountQueries.me(), storeQueries.me()],
  });
  const selected = useWorkspaceSelectionStore((state) => state.selected[account.data.id]);
  const savedId = selected ?? selectedWorkspaceId(account.data.id);
  const active = workspaces.data.memberships.filter(
    (item) => item.status === 'ACTIVE' && item.workspace.status === 'ACTIVE',
  );
  const membership = active.find((item) => item.workspace.id === savedId) ?? active[0];
  useEffect(() => {
    const workspaceId = membership?.workspace.id ?? null;
    if (selectedWorkspaceId(account.data.id) !== workspaceId) {
      abortWorkspaceRequests();
      useHandoffDraftStore.getState().reset();
    }
    useWorkspaceSelectionStore.getState().select(account.data.id, workspaceId);
  }, [account.data.id, membership?.workspace.id]);
  if (!membership) return <Redirect href={ROUTES.store} />;
  return (
    <MainContextProvider
      key={`${account.data.id}:${membership.workspace.id}`}
      value={{
        profile: account.data,
        membership,
        workspaceId: membership.workspace.id,
        storeName: membership.workspace.name,
        userId: account.data.id,
        canManage: membership.role === 'ADMIN',
      }}
    >
      {children}
    </MainContextProvider>
  );
}
