import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { BottomActionBar, Box, ScreenHeader, StepProgressBar, Text } from '@/shared/ui';
import { SCREEN_PADDING_X } from '@/theme';

type StoreStepLayoutProps = {
  onBack: () => void;
  progress: { current: number; total: number };
  title: string;
  description: string;
  children: ReactNode;
  action: ReactNode;
};

const SPEC = {
  titleTop: 20,
  bodyTop: 40,
  bodyBottom: 22,
  headlineGap: 12,
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
    <Box background="backgroundDefault" style={styles.root}>
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
          <Text variant="body" weight="medium" color="foregroundDefault">
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
