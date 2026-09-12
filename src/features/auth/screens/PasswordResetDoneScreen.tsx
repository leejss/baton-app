import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { logger } from '@/shared/lib/logger';
import { Button } from '@/shared/ui';

import { PasswordResetLayout } from '@/features/auth/components/PasswordResetLayout';

/** Figma "04 비밀번호 재설정 (완료)" — `943:111439`. */
export type PasswordResetDoneScreenProps = {
  onBack?: () => void;
  onGoToSignIn?: () => void;
};

const SPEC = {
  /** 제목 묶음 하단(236) → 일러스트 상단(320). 레이아웃 기본값 40을 덮는다. */
  illustrationTop: 84,
  /** 일러스트(`1306:18352`)는 x=73, 247×233 — 화면 가운데 정렬이다. */
  illustrationWidth: 247,
  illustrationHeight: 233,
} as const;

/** 아직 연결할 화면·API가 없는 동작. 조용히 삼키지 않고 로그로 남긴다. */
function notWired(action: string) {
  return () => logger.warn('비밀번호 재설정 동작이 아직 연결되지 않았습니다', { action });
}

export function PasswordResetDoneScreen({
  onBack = notWired('back'),
  onGoToSignIn = notWired('goToSignIn'),
}: PasswordResetDoneScreenProps) {
  return (
    <PasswordResetLayout
      onBack={onBack}
      isTitleCentered
      title="비밀번호가 변경되었어요!"
      description="새 비밀번호로 로그인 해주세요."
      bodyTop={SPEC.illustrationTop}
      action={<Button label="로그인하러 가기" onPress={onGoToSignIn} />}
    >
      <Illustration />
    </PasswordResetLayout>
  );
}

/** 장식용 일러스트. 제목이 같은 뜻을 이미 전달하므로 접근성 트리에서 감춘다. */
function Illustration() {
  return (
    <Image
      style={styles.illustration}
      source={require('@/assets/images/auth/password-reset-done.png')}
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
});
