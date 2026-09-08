import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomActionBar, Box, StepProgressBar } from '@/shared/ui';
import { SCREEN_PADDING_X } from '@/theme';

import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { AuthTitle } from '@/features/auth/components/AuthTitle';

/**
 * 회원가입 6개 화면이 공유하는 뼈대. 세로 리듬은 Figma "회원가입" 섹션
 * (`943:111452`, 393×852) 실측값이다.
 *
 * 비밀번호 재설정(`PasswordResetLayout`)과 거의 같지만 헤더 바로 아래 진행 표시가 붙고,
 * 하단 바 위에 토스트 자리가 있다.
 */
const SPEC = {
  /** 진행 표시 하단(112) → 제목 상단(132). */
  titleTopWithProgress: 20,
  /** 진행 표시가 없는 완료 화면: 헤더 하단(106) → 제목 상단(132). */
  titleTop: 26,
  /** 제목 묶음 하단 → 본문 상단. 완료 화면만 27이다. */
  bodyTop: 40,
  /** 본문 하단 여백. 키보드가 올라올 때 마지막 입력이 붙지 않도록. */
  bodyBottom: 22,
  /** 토스트 레이아웃(`Notification Layout`) 하단(728) → 하단 바 상단(732). */
  toastBottom: 4,
  /** `Notification Layout`의 안쪽 세로 여백. */
  toastPaddingVertical: 14,
} as const;

export type SignupLayoutProps = {
  /** 생략하면 뒤로가기를 그리지 않는다(완료 화면). 높이는 그대로 차지한다. */
  onBack?: () => void;
  /** 진행 표시. 생략하면(완료 화면) 표시하지 않고 제목이 헤더 바로 아래 온다. */
  progress?: { current: number; total: number };
  title: string;
  description?: string;
  isTitleCentered?: boolean;
  children?: ReactNode;
  /** 제목 ↔ 본문 간격. 시안 기본은 40이고 완료 화면만 27이다. */
  bodyTop?: number;
  /** 하단 고정 바에 들어갈 주 액션. */
  action: ReactNode;
  /** 하단 바 위에 겹쳐 뜨는 토스트. 본문을 밀지 않는다. */
  toast?: ReactNode;
};

export function SignupLayout({
  onBack,
  progress,
  title,
  description,
  isTitleCentered = false,
  children,
  bodyTop = SPEC.bodyTop,
  action,
  toast,
}: SignupLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <Box background="background" style={[styles.root, { paddingTop: insets.top }]}>
      <AuthHeader onBack={onBack} />

      {progress !== undefined && (
        <View style={styles.progress}>
          <StepProgressBar total={progress.total} current={progress.current} />
        </View>
      )}

      <View style={styles.body}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          bottomOffset={SPEC.bodyBottom}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              marginTop: progress !== undefined ? SPEC.titleTopWithProgress : SPEC.titleTop,
            }}
          >
            <AuthTitle title={title} description={description} isCentered={isTitleCentered} />
          </View>

          {children !== undefined && <View style={{ marginTop: bodyTop }}>{children}</View>}
        </KeyboardAwareScrollView>

        {toast !== undefined && (
          <View style={styles.toast} pointerEvents="box-none">
            {toast}
          </View>
        )}
      </View>

      <BottomActionBar>{action}</BottomActionBar>
    </Box>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  progress: { paddingHorizontal: SCREEN_PADDING_X },
  /** 스크롤 영역과 토스트를 같은 상자에 두어 토스트가 하단 바 바로 위에 오게 한다. */
  body: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingBottom: SPEC.bodyBottom,
  },
  toast: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPEC.toastBottom,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingVertical: SPEC.toastPaddingVertical,
  },
});
