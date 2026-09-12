import { Redirect } from 'expo-router';
import { ROUTES } from '@/shared/lib/routes';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function IndexRoute() {
  const status = useAuthStore((state) => state.status);
  const reason = useAuthStore((state) => state.signOutReason);
  if (status === 'restoring') return null;
  if (reason === 'withdrawn') return <Redirect href={ROUTES.settings.result('withdrawn')} />;
  return <Redirect href={status === 'signedIn' ? ROUTES.home : ROUTES.auth.start} />;
}
