import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomActionBar, Box, TextLink } from '@/shared/ui';
import { SCREEN_PADDING_X } from '@/theme';

import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { AuthTitle } from '@/features/auth/components/AuthTitle';

/**
 * 비밀번호 재설정 4개 화면이 공유하는 뼈대. 세로 리듬은 Figma
 * "비밀번호 재설정" 섹션(`943:111331`, 393×852) 실측값이다.
 */
const SPEC = {
  /** 헤더 하단(106) → 제목 상단(132). */
  titleTop: 26,
  /** 제목 묶음 하단(236) → 본문 상단(276). */
  bodyTop: 40,
  /** "로그인 화면으로 돌아가기" 하단(710) → 하단 바 상단(732). */
  backLinkBottom: 22,
} as const;

export type PasswordResetLayoutProps = {
  onBack: () => void;
  isBackDisabled?: boolean;
  title: string;
  description?: string;
  isTitleCentered?: boolean;
  /** 제목 아래 본문. 입력 필드나 일러스트가 들어간다. */
  children?: ReactNode;
  /** 제목 ↔ 본문 간격. 시안 기본은 40이고 완료 화면만 27이다. */
  bodyTop?: number;
  /** 주면 하단 바 위에 "로그인 화면으로 돌아가기"를 띄운다. 03·04 화면에는 없다. */
  onBackToSignIn?: () => void;
  /** 하단 고정 바에 들어갈 주 액션. */
  action: ReactNode;
};

export function PasswordResetLayout({
  onBack,
  isBackDisabled = false,
  title,
  description,
  isTitleCentered = false,
  children,
  bodyTop = SPEC.bodyTop,
  onBackToSignIn,
  action,
}: PasswordResetLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <Box background="backgroundDefault" style={[styles.root, { paddingTop: insets.top }]}>
      <AuthHeader onBack={onBack} isBackDisabled={isBackDisabled} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        bottomOffset={SPEC.backLinkBottom}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.title}>
          <AuthTitle title={title} description={description} isCentered={isTitleCentered} />
        </View>

        {children !== undefined && <View style={{ marginTop: bodyTop }}>{children}</View>}

        {/* 남는 높이를 흡수해 아래 링크를 하단 바 바로 위에 붙인다. */}
        <View style={styles.spacer} />

        {onBackToSignIn !== undefined && (
          <TextLink
            label="로그인 화면으로 돌아가기"
            color="foregroundSubtle"
            onPress={onBackToSignIn}
          />
        )}
      </KeyboardAwareScrollView>

      <BottomActionBar>{action}</BottomActionBar>
    </Box>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingBottom: SPEC.backLinkBottom,
  },
  title: { marginTop: SPEC.titleTop },
  spacer: { flexGrow: 1 },
});
