import { Image } from 'expo-image';
import { Alert, StyleSheet } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { Button } from '@/shared/ui';

import { useAuthOperation } from '@/features/auth/hooks/useAuthOperation';
import { SignupLayout } from '@/features/auth/components/SignupLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSignupStore } from '@/features/auth/store/signupStore';

const SPEC = {
  illustrationTop: 44,
  illustrationWidth: 319,
  illustrationHeight: 352,
  confettiLeft: -30,
  confettiWidth: 454,
  confettiHeight: 272,
} as const;

export function SignupCompleteScreen() {
  const pendingSession = useSignupStore((state) => state.pendingSession);
  const clearSignup = useSignupStore((state) => state.clear);
  const signIn = useAuthStore((state) => state.signIn);

  const operation = useAuthOperation('signup');
  const handleStart = () =>
    operation.run(
      'start',
      async ({ signal }) => {
        if (pendingSession === null) {
          Alert.alert('가입 정보를 찾지 못했어요', '로그인 화면에서 로그인해주세요.');
          return;
        }
        await signIn(pendingSession, signal);
        clearSignup();
      },
      (error) => Alert.alert('시작하지 못했어요', normalizeError(error).message),
    );

  return (
    <SignupLayout
      isTitleCentered
      title="회원가입이 완료 됐어요"
      description="이제 Baton을 시작해보세요"
      bodyTop={SPEC.illustrationTop}
      action={
        <Button
          color="blue"
          label="시작하기"
          disabled={operation.isPending}
          isLoading={operation.isPending}
          onPress={handleStart}
        />
      }
      backdrop={
        <Image
          style={styles.confetti}
          source={require('@/assets/images/auth/signup-complete-confetti.png')}
          contentFit="contain"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      }
    >
      <Image
        style={styles.illustration}
        source={require('@/assets/images/auth/signup-complete.png')}
        contentFit="contain"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </SignupLayout>
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
