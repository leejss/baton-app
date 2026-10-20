import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomActionBar, Box, StepProgressBar, Text, textStyles } from '@/shared/ui';
import { SCREEN_PADDING_X } from '@/theme';

import { AuthHeader } from '@/features/auth/components/AuthHeader';

const SPEC = {
  titleTopWithProgress: 20,
  titleTop: 26,
  bodyTop: 40,
  bodyBottom: 22,
} as const;

type SignupLayoutProps = {
  onBack?: () => void;
  progress?: { current: number; total: number };
  isBackDisabled?: boolean;
  title: string;
  description?: string;
  isTitleCentered?: boolean;
  children?: ReactNode;
  bodyTop?: number;
  action: ReactNode;
  backdrop?: ReactNode;
};

export function SignupLayout({
  onBack,
  isBackDisabled = false,
  progress,
  title,
  description,
  isTitleCentered = false,
  children,
  bodyTop = SPEC.bodyTop,
  action,
  backdrop,
}: SignupLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <Box background="backgroundDefault" style={[styles.root, { paddingTop: insets.top }]}>
      {backdrop !== undefined && (
        <View style={styles.backdrop} pointerEvents="none">
          {backdrop}
        </View>
      )}

      <AuthHeader onBack={onBack} isBackDisabled={isBackDisabled} />

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
            style={[
              styles.title,
              { marginTop: progress !== undefined ? SPEC.titleTopWithProgress : SPEC.titleTop },
            ]}
          >
            <Text variant="display" weight="bold" style={isTitleCentered && textStyles.center}>
              {title}
            </Text>
            {description !== undefined && (
              <Text
                variant="body"
                weight="medium"
                color="foregroundDefault"
                style={isTitleCentered && textStyles.center}
              >
                {description}
              </Text>
            )}
          </View>

          {children !== undefined && <View style={{ marginTop: bodyTop }}>{children}</View>}
        </KeyboardAwareScrollView>
      </View>

      <BottomActionBar>{action}</BottomActionBar>
    </Box>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { gap: 12 },
  progress: { paddingHorizontal: SCREEN_PADDING_X },
  body: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingBottom: SPEC.bodyBottom,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
