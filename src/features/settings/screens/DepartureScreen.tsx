import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useWithdraw } from '@/features/auth/api/account.mutations';
import { useLeaveCurrentStore } from '@/features/settings/api/settings.mutations';
import { DepartureConsent } from '@/features/settings/components/DepartureConsent';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { SettingsMessage } from '@/features/settings/components/SettingsMessage';
import { TransferRequired } from '@/features/settings/components/TransferRequired';
import { DEPARTURE_COPY, hasTransferCandidates } from '@/features/settings/lib/departure';
import { storeQueries } from '@/features/stores/api/store.queries';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { normalizeError } from '@/shared/api/errors';
import { goBackOr } from '@/shared/lib/navigation';
import { ROUTES } from '@/shared/lib/routes';
import { QueryBoundary } from '@/shared/ui';

export function DepartureScreen({ kind }: { kind: 'leave' | 'withdraw' }) {
  const router = useRouter();
  const { storeId, userId, canManage } = useMainContext();
  const members = useQuery({ ...storeQueries.members(storeId), enabled: canManage });
  const [acknowledged, setAcknowledged] = useState(false);
  const leave = useLeaveCurrentStore(storeId, userId);
  const withdraw = useWithdraw();
  const mutation = kind === 'leave' ? leave : withdraw;
  const isBlocked =
    (canManage && members.data && hasTransferCandidates(members.data, userId)) ||
    (mutation.error && normalizeError(mutation.error).errorCode === 'MANAGER_TRANSFER_REQUIRED');
  const onBack = () => goBackOr(ROUTES.my);
  if (isBlocked)
    return (
      <TransferRequired
        kind={kind}
        onCancel={onBack}
        onTransfer={() => router.push(ROUTES.settings.transfer(kind))}
      />
    );
  const copy = DEPARTURE_COPY[kind];
  return (
    <SettingsLayout
      title={copy.title}
      description={copy.description}
      onBack={onBack}
      feedback={
        mutation.error && (
          <SettingsMessage tone="error" message={normalizeError(mutation.error).message} />
        )
      }
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
