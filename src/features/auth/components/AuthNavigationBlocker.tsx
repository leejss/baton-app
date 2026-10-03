import { NavigationContext, usePreventRemove } from 'expo-router/react-navigation';
import { useContext } from 'react';

/** SDK 57에서는 이탈 방지 훅이 expo-router/react-navigation에 있다. */
export function AuthNavigationBlocker({ isPending }: { isPending: boolean }) {
  const navigation = useContext(NavigationContext);
  return navigation ? <RemovalGuard isPending={isPending} /> : null;
}

function RemovalGuard({ isPending }: { isPending: boolean }) {
  usePreventRemove(isPending, () => {});
  return null;
}
