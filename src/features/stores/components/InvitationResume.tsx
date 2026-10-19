import { useEffect } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useStoreJoinStore } from '@/features/stores/store/storeJoinStore';
import { ROUTES } from '@/shared/lib/routes';
import { reportError } from '@/shared/lib/reportError';
export function InvitationResume() {
  const status = useAuthStore((state) => state.status);
  const { token, hydrated, preview } = useStoreJoinStore();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    void useStoreJoinStore.getState().restore().catch(reportError);
  }, []);
  useEffect(() => {
    if (
      status === 'signedIn' &&
      hydrated &&
      token &&
      !preview &&
      pathname !== '/workspace/join' &&
      !pathname.startsWith('/store/join')
    )
      router.replace(ROUTES.workspaceInvitation);
  }, [status, hydrated, token, preview, pathname, router]);
  return null;
}
