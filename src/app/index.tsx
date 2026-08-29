import { Redirect } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';

export default function IndexRoute() {
  const status = useAuthStore((state) => state.status);

  if (status === 'restoring') {
    return null;
  }

  return <Redirect href={status === 'signedIn' ? '/home' : '/start'} />;
}
