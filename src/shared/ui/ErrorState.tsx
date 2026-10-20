import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/shared/api/errors';
import { Button } from '@/shared/ui/Button';
import { Text, textStyles } from '@/shared/ui/Text';
import { spacing } from '@/theme';

type ErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
  onBack?: () => void;
};

export function ErrorState({ error, onRetry, onBack }: ErrorStateProps) {
  const appError = normalizeError(error);

  return (
    <View style={styles.container}>
      <Text variant="display" weight="bold" style={textStyles.center}>
        문제가 발생했어요
      </Text>
      <Text color="foregroundDefault" style={textStyles.center}>
        {appError.message}
      </Text>
      {onBack && <Button label="이전 화면으로" onPress={onBack} />}
      {onRetry !== undefined && <Button label="다시 시도" tone="weak" onPress={onRetry} />}
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
