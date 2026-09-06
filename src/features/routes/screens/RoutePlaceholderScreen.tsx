import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Text, textStyles } from '@/shared/ui';
import { MAX_CONTENT_WIDTH, spacing } from '@/theme';

type RoutePlaceholderScreenProps = {
  description: string;
  featureIds: string;
  title: string;
};

/** 라우트 구조를 먼저 검증할 수 있도록 기능 구현 전 화면의 경계를 표시한다. */
export function RoutePlaceholderScreen({
  description,
  featureIds,
  title,
}: RoutePlaceholderScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <Box background="background" style={styles.root}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
      >
        <View style={styles.inner}>
          <Text variant="heading" style={textStyles.center}>
            {title}
          </Text>
          <Text color="textSecondary" style={textStyles.center}>
            {description}
          </Text>
          <Text variant="caption" color="textTertiary" style={textStyles.center}>
            기능 명세: {featureIds}
          </Text>
        </View>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    gap: spacing.sm,
  },
});
