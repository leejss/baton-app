import { useLocalSearchParams, useRouter } from "expo-router";

import { HandoffListScreen } from "@/features/handoffs/screens/HandoffListScreen";
import { isHandoffScope, type HandoffScope } from "@/features/handoffs/types";

export default function HandoffsRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scope?: string }>();
  const scope: HandoffScope = isHandoffScope(params.scope)
    ? params.scope
    : "all";

  return (
    <HandoffListScreen
      scope={scope}
      onCreate={() => router.push("/(main)/handoffs/new")}
      onEdit={(handoffId) =>
        router.push({
          pathname: "/(main)/handoffs/[handoffId]/edit",
          params: { handoffId },
        })
      }
      onOpen={(handoffId) =>
        router.push({
          pathname: "/(main)/handoffs/[handoffId]",
          params: { handoffId },
        })
      }
      onScopeChange={(nextScope) => router.setParams({ scope: nextScope })}
    />
  );
}
