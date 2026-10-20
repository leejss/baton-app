import { NavigationContext, usePreventRemove } from 'expo-router/react-navigation';
import { useContext } from 'react';

export function AuthNavigationBlocker({ isPending }: { isPending: boolean }) {
  const navigation = useContext(NavigationContext);
  return navigation ? <RemovalGuard isPending={isPending} /> : null;
}

function RemovalGuard({ isPending }: { isPending: boolean }) {
  usePreventRemove(isPending, () => {});
  return null;
}
