import { useState } from 'react';
import { Image } from 'expo-image';
import { Alert, StyleSheet } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { Button } from '@/shared/ui';

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
  /** 제목 묶음 하단(236) → 일러스트 상단(280). 레이아웃 기본값 40을 덮는다. */
  illustrationTop: 44,
  /** 일러스트(`1306:18353`)는 x=37, 319×352 — 화면 가운데 정렬이다. */
  illustrationWidth: 319,
  illustrationHeight: 352,
  /**
   * 콘페티(`1306:18354`)는 x=-30, y=44, 454×272. 상태 바 바로 아래에서 시작해
   * 좌우로 흘러넘치므로 `backdrop` 레이어(0 = 시안 y=44)에 절대 좌표로 얹는다.
   */
  confettiLeft: -30,
  confettiWidth: 454,
  confettiHeight: 272,
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
      backdrop={<Confetti />}
    >
      <Illustration />
    </SignupLayout>
  );
}

/** 장식용 일러스트. 제목이 같은 뜻을 이미 전달하므로 접근성 트리에서 감춘다. */
function Illustration() {
  return (
    <Image
      style={styles.illustration}
      source={require('@/assets/images/auth/signup-complete.png')}
      contentFit="contain"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

/** 헤더·제목 뒤에 깔리는 색종이. */
function Confetti() {
  return (
    <Image
      style={styles.confetti}
      source={require('@/assets/images/auth/signup-complete-confetti.png')}
      contentFit="contain"
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
  confetti: {
    position: 'absolute',
    top: 0,
    left: SPEC.confettiLeft,
    width: SPEC.confettiWidth,
    height: SPEC.confettiHeight,
  },
});
