import { router } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { StartScreen } from '@/features/auth/screens/StartScreen';

export default function StartRoute() {
  return <StartScreen onSocialSignupRequired={() => router.push(ROUTES.signup.name)} />;
}
