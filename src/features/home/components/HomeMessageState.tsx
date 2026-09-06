import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/shared/ui';
import { spacing, useTheme } from '@/theme';

type HomeMessageStateProps = {
  compact?: boolean;
  isLoading?: boolean;
  message: string;
  onRetry?: () => void;
};

export function HomeMessageState({
  compact = false,
  isLoading = false,
  message,
  onRetry,
}: HomeMessageStateProps) {
  const theme = useTheme();

  return (
    <View accessibilityLiveRegion="polite" style={[styles.root, compact && styles.compact]}>
      {onRetry === undefined && <ActivityIndicator color={theme.colors.textSecondary} />}
      <Text color="textSecondary" style={styles.message} selectable>
        {message}
      </Text>
      {onRetry !== undefined && (
        <Button label="다시 시도" variant="secondary" isLoading={isLoading} onPress={onRetry} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  message: {
    textAlign: 'center',
  },
  compact: {
    minHeight: 88,
    padding: spacing.sm,
    gap: spacing.sm,
  },
});
