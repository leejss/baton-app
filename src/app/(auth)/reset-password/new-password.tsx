import { router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';

import { PasswordResetNewPasswordScreen } from '@/features/auth/screens/PasswordResetNewPasswordScreen';

export default function PasswordResetNewPasswordRoute() {
  return (
    <PasswordResetNewPasswordScreen
      onBack={() => goBackOr('/reset-password/code')}
      // 완료 후에는 뒤로 돌아올 이유가 없으므로 교체한다.
      onSubmit={() => router.replace('/reset-password/done')}
    />
  );
}
