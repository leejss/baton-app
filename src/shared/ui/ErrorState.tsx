import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { Text, textStyles } from '@/shared/ui/Text';
import { spacing } from '@/theme';

type ErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
};

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const appError = normalizeError(error);

  return (
    <View style={styles.container}>
      <Text variant="title" style={textStyles.center}>
        문제가 발생했어요
      </Text>
      <Text color="textSecondary" style={textStyles.center}>
        {appError.message}
      </Text>
      {onRetry !== undefined && <Button label="다시 시도" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
});
