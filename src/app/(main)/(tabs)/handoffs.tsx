import { useLocalSearchParams, useRouter } from 'expo-router';

import { HandoffListScreen } from '@/features/handoffs/screens/HandoffListScreen';
import { isHandoffScope, type HandoffScope } from '@/features/handoffs/model/handoff';
import { QueryBoundary } from '@/shared/ui';

export default function HandoffsRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scope?: string }>();
  const scope: HandoffScope = isHandoffScope(params.scope) ? params.scope : 'all';

  return (
    <QueryBoundary resetKey={scope}>
      <HandoffListScreen
        scope={scope}
        onBack={router.back}
        onCreate={() => router.push('/(main)/handoffs/new')}
        onEdit={(handoffId) =>
          router.push({ pathname: '/(main)/handoffs/[handoffId]/edit', params: { handoffId } })
        }
        onNotificationPress={() => router.push('/(main)/notifications')}
        onOpen={(handoffId) =>
          router.push({ pathname: '/(main)/handoffs/[handoffId]', params: { handoffId } })
        }
        onScopeChange={(nextScope) => router.setParams({ scope: nextScope })}
      />
    </QueryBoundary>
  );
}
