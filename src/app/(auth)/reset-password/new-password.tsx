import { Redirect, router } from 'expo-router';

import { goBackOr } from '@/shared/lib/navigation';

import { PasswordResetNewPasswordScreen } from '@/features/auth/screens/PasswordResetNewPasswordScreen';
import { usePasswordResetStore } from '@/features/auth/store/passwordResetStore';

export default function PasswordResetNewPasswordRoute() {
  const verificationToken = usePasswordResetStore((state) => state.verificationToken);

  // 이메일 인증을 건너뛰고 들어올 수 없다.
  if (verificationToken === null) {
    return <Redirect href="/reset-password" />;
  }

  return (
    <PasswordResetNewPasswordScreen
      onBack={() => goBackOr('/reset-password/code')}
      // 완료 후에는 뒤로 돌아올 이유가 없으므로 교체한다.
      onChanged={() => router.replace('/reset-password/done')}
    />
  );
}
