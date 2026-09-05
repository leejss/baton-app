import { router } from 'expo-router';

import { PasswordResetDoneScreen } from '@/features/auth/screens/PasswordResetDoneScreen';

export default function PasswordResetDoneRoute() {
  // 재설정이 끝난 뒤라 뒤로 가기도 로그인 화면으로 보낸다.
  const goToSignIn = () => router.navigate('/login');

  return <PasswordResetDoneScreen onBack={goToSignIn} onGoToSignIn={goToSignIn} />;
}
