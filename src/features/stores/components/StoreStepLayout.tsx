import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { BottomActionBar, Box, ScreenHeader, StepProgressBar, Text } from '@/shared/ui';
import { SCREEN_PADDING_X } from '@/theme';

/**
 * 매장 생성 3개 화면이 공유하는 뼈대. 세로 리듬은 Figma "관리자 - 매장생성" 섹션
 * (`943:111999`, 393×852) 실측값이다.
 */
export type StoreStepLayoutProps = {
  onBack: () => void;
  progress: { current: number; total: number };
  title: string;
  description: string;
  children: ReactNode;
  /** 하단 고정 바의 주 액션. */
  action: ReactNode;
};

const SPEC = {
  /** 진행 표시 하단 → 제목 상단. */
  titleTop: 20,
  /** 제목 묶음 ↔ 입력. */
  bodyTop: 40,
  /** 키보드가 올라올 때 마지막 입력이 붙지 않도록. */
  bodyBottom: 22,
  /** 제목 ↔ 설명. */
  headlineGap: 12,
  /** 입력 필드 사이. 시안 `3xl`(32). */
  fieldGap: 32,
} as const;

export function StoreStepLayout({
  onBack,
  progress,
  title,
  description,
  children,
  action,
}: StoreStepLayoutProps) {
  return (
    <Box background="background" style={styles.root}>
      <ScreenHeader onBack={onBack} />

      <View style={styles.progress}>
        <StepProgressBar total={progress.total} current={progress.current} />
      </View>

      <KeyboardAwareScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={SPEC.bodyBottom}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headline}>
          <Text variant="display" weight="bold">
            {title}
          </Text>
          <Text variant="body" weight="medium" color="textSecondary">
            {description}
          </Text>
        </View>

        <View style={styles.fields}>{children}</View>
      </KeyboardAwareScrollView>

      <BottomActionBar>{action}</BottomActionBar>
    </Box>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  progress: { paddingHorizontal: SCREEN_PADDING_X },
  body: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: SPEC.titleTop,
    paddingBottom: SPEC.bodyBottom,
  },
  headline: { gap: SPEC.headlineGap },
  fields: { marginTop: SPEC.bodyTop, gap: SPEC.fieldGap },
});
