import { createContext, useContext } from 'react';
import type { UserProfile } from '@/features/auth/api/auth.schema';
import type { Membership } from '@/features/stores/api/store.schema';
type MainContext = {
  profile: UserProfile;
  membership: Membership;
  workspaceId: number;
  storeName: string;
  userId: number;
  canManage: boolean;
};
export const MainContextProvider = createContext<MainContext | null>(null);
export function useMainContext(): MainContext {
  const context = useContext(MainContextProvider);
  if (!context) throw new Error('활성 워크스페이스 영역에서만 사용할 수 있습니다.');
  return context;
}
