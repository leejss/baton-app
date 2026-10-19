import { router } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { Modal, MODAL_ICON_SIZE } from '@/shared/ui';
import { AlertCircleFill } from '@/shared/ui/icons';

import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * 서버가 세션을 끊었을 때 뜨는 모달. 시안 `강제 로그아웃 - 다른 기기 로그인 감지`
 * (`943:111014`)의 01-1 화면이다.
 *
 * 루트 레이아웃에 두는 이유: 사용자가 어느 화면에 있든 그 위에 떠야 한다.
 * 세션 만료는 화면과 무관하게 아무 요청에서나 발생한다.
 *
 * 닫기(X)와 확인 버튼은 같은 곳으로 간다. 세션이 이미 없어서 원래 화면으로 돌아갈 수
 * 없기 때문이다. 결과가 같아도 시안대로 닫기를 둔다 — 모달 오른쪽 위의 X는 사용자가
 * 습관적으로 찾는 자리라, 없으면 갇힌 느낌을 준다.
 */
export function ForcedLogoutModal() {
  const signOutReason = useAuthStore((state) => state.signOutReason);

  /** 안내를 닫고 소셜 로그인 시작 화면으로 돌아간다. */
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
