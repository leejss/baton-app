import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useWithdraw } from '@/features/auth/api/account.mutations';
import { useLeaveCurrentStore } from '@/features/settings/api/settings.mutations';
import { DepartureConsent } from '@/features/settings/components/DepartureConsent';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { SettingsMessage } from '@/features/settings/components/SettingsMessage';
import { TransferRequired } from '@/features/settings/components/TransferRequired';
import { DEPARTURE_COPY, hasTransferCandidates } from '@/features/settings/lib/departure';
import { storeQueries } from '@/features/stores/api/store.queries';
import { selectWorkspace } from '@/features/stores/store/workspaceSelectionStore';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { normalizeError } from '@/shared/api/errors';
import { goBackOr } from '@/shared/lib/navigation';
import { ROUTES } from '@/shared/lib/routes';
import { QueryBoundary } from '@/shared/ui';

export function DepartureScreen({ kind }: { kind: 'leave' | 'withdraw' }) {
  const router = useRouter();
  const client = useQueryClient();
  const { workspaceId, userId, canManage } = useMainContext();
  const members = useQuery({ ...storeQueries.members(workspaceId), enabled: canManage });
  const [acknowledged, setAcknowledged] = useState(false);
  const leave = useLeaveCurrentStore(workspaceId, userId);
  const withdraw = useWithdraw();
  const mutation = kind === 'leave' ? leave : withdraw;
  const failure = mutation.error ? normalizeError(mutation.error) : null;
  const details = failure?.details;
  const blockedWorkspaceId =
    details &&
    typeof details === 'object' &&
    'workspaceId' in details &&
    typeof details.workspaceId === 'number'
      ? details.workspaceId
      : workspaceId;
  const isBlocked =
    (canManage && members.data && hasTransferCandidates(members.data, userId)) ||
    failure?.errorCode === 'MANAGER_TRANSFER_REQUIRED';
  const onBack = () => goBackOr(ROUTES.my);
  if (isBlocked)
    return (
      <TransferRequired
        kind={kind}
        onCancel={onBack}
        onTransfer={() => {
          if (blockedWorkspaceId === workspaceId) {
            router.push(ROUTES.settings.transfer(kind));
            return;
          }
          void (async () => {
            const { memberships } = await client.fetchQuery({ ...storeQueries.me(), staleTime: 0 });
            if (
              !memberships.some(
                (item) => item.workspace.id === blockedWorkspaceId && item.status === 'ACTIVE',
              )
            )
              throw new Error('해당 워크스페이스의 참여를 확인할 수 없어요.');
            await selectWorkspace(client, userId, blockedWorkspaceId);
            router.push(ROUTES.settings.transfer(kind));
          })().catch((error) =>
            Alert.alert('워크스페이스를 열지 못했어요', normalizeError(error).message),
          );
        }}
      />
    );
  const copy = DEPARTURE_COPY[kind];
  return (
    <SettingsLayout
      title={copy.title}
      description={copy.description}
      onBack={onBack}
      feedback={failure && <SettingsMessage tone="error" message={failure.message} />}
    >
      <QueryBoundary query={canManage ? members : undefined}>
        <DepartureConsent
          kind={kind}
          acknowledged={acknowledged}
          isPending={mutation.isPending}
          onToggle={() => setAcknowledged(!acknowledged)}
          onConfirm={() => {
            if (acknowledged && !mutation.isPending) mutation.mutate();
          }}
        />
      </QueryBoundary>
    </SettingsLayout>
  );
}
