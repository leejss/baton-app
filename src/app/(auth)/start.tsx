import { router } from 'expo-router';

import { StartScreen } from '@/features/auth/screens/StartScreen';

export default function StartRoute() {
  return <StartScreen onStartWithEmail={() => router.push('/login')} />;
}
