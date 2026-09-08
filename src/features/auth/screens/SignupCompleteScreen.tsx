import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { Box, Button } from '@/shared/ui';

import { SignupLayout } from '@/features/auth/components/SignupLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSignupStore } from '@/features/auth/store/signupStore';

/**
 * Figma "01-9 회원가입 완료" — `943:111453`.
 *
 * 계정은 이미 만들어졌고 세션은 `signupStore.pendingSession`에 있다. "시작하기"를 누르면
 * 로그인 상태로 전환되고 `(auth)/_layout`의 가드가 매장 소속 확인 단계로 보낸다.
 *
 * 시안에는 뒤로가기 화살표가 있지만 그리지 않는다 — 계정 생성이 끝난 뒤라 돌아갈 단계가
 * 없다. 헤더 높이는 다른 화면과 맞추려고 그대로 둔다.
 */
export type SignupCompleteScreenProps = {
  /** 로그인 상태로 전환된 뒤. 기본 동작은 가드의 리다이렉트에 맡기므로 보통 생략한다. */
  onStarted?: () => void;
};

const SPEC = {
  /** 제목 묶음 하단(236) → 일러스트 상단(263). 레이아웃 기본값 40을 덮는다. */
  illustrationTop: 27,
  illustrationWidth: 287,
  illustrationHeight: 227,
} as const;

export function SignupCompleteScreen({ onStarted }: SignupCompleteScreenProps) {
  const pendingSession = useSignupStore((state) => state.pendingSession);
  const clearSignup = useSignupStore((state) => state.clear);
  const signIn = useAuthStore((state) => state.signIn);

  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    if (pendingSession === null) {
      Alert.alert('가입 정보를 찾지 못했어요', '처음부터 다시 진행해주세요.');
      return;
    }

    setIsStarting(true);
    try {
      await signIn(pendingSession);
      clearSignup();
      onStarted?.();
    } catch (error) {
      setIsStarting(false);
      Alert.alert('시작하지 못했어요', normalizeError(error).message);
    }
  };

  return (
    <SignupLayout
      isTitleCentered
      title="회원가입이 완료 됐어요"
      description="이제 Baton을 시작해보세요"
      bodyTop={SPEC.illustrationTop}
      action={
        <Button variant="accent" label="시작하기" isLoading={isStarting} onPress={handleStart} />
      }
    >
      <Illustration />
    </SignupLayout>
  );
}

/** 시안에서 아직 회색 사각형인 자리. 일러스트가 나오면 이 컴포넌트만 교체한다. */
function Illustration() {
  return (
    <Box
      background="placeholder"
      style={styles.illustration}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  illustration: {
    width: SPEC.illustrationWidth,
    height: SPEC.illustrationHeight,
    alignSelf: 'center',
  },
});
