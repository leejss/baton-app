import { router } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { Modal, MODAL_ICON_SIZE } from '@/shared/ui';
import { AlertCircleFill } from '@/shared/ui/icons';

import { useAuthStore } from '@/features/auth/store/authStore';

export function ForcedLogoutModal() {
  const signOutReason = useAuthStore((state) => state.signOutReason);

  const goToSignIn = () => {
    useAuthStore.getState().clearSignOutReason();
    router.replace(ROUTES.auth.start);
  };

  return (
    <Modal
      isVisible={signOutReason === 'sessionRevoked'}
      icon={<AlertCircleFill size={MODAL_ICON_SIZE} color="foregroundWarningDefault" />}
      title="로그아웃 되었어요"
      description={'다른 기기에서 로그인 되어\n현재 기기의 접속이 종료되었어요.'}
      confirmLabel="로그인 화면으로 이동"
      onConfirm={goToSignIn}
      onClose={goToSignIn}
    />
  );
}
