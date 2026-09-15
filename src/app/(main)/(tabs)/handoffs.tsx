import { useLocalSearchParams, useRouter } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { HandoffListScreen } from '@/features/handoffs/screens/HandoffListScreen';
import { isHandoffScope, type HandoffScope } from '@/features/handoffs/types';

export default function HandoffsRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scope?: string }>();
  const scope: HandoffScope = isHandoffScope(params.scope) ? params.scope : 'all';
  const handleBack = () => (router.canGoBack() ? router.back() : router.navigate(ROUTES.home));

  return (
    <HandoffListScreen
      onBack={handleBack}
      scope={scope}
      onCreate={() => router.push(ROUTES.handoffs.new.index)}
      onEdit={(handoffId) => router.push(ROUTES.handoffs.edit(handoffId))}
      onOpen={(handoffId) => router.push(ROUTES.handoffs.detail(handoffId))}
      onScopeChange={(nextScope) => router.setParams({ scope: nextScope })}
    />
  );
}
