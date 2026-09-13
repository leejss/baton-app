import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Text, textStyles } from '@/shared/ui';
import { MAX_CONTENT_WIDTH, spacing } from '@/theme';

type RoutePlaceholderScreenProps = {
  header?: ReactNode;
  description: string;
  featureIds: string;
  title: string;
};

export function RoutePlaceholderScreen({
  header,
  description,
  featureIds,
  title,
}: RoutePlaceholderScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <Box background="backgroundDefault" style={styles.root}>
      {header}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: (header ? 0 : insets.top) + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
      >
        <View style={styles.inner}>
          {!header && (
            <Text variant="heading" style={textStyles.center}>
              {title}
            </Text>
          )}
          <Text color="foregroundDefault" style={textStyles.center}>
            {description}
          </Text>
          <Text variant="caption" color="foregroundSubtle" style={textStyles.center}>
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
