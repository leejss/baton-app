import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/shared/ui';
import { spacing } from '@/theme';

type ScheduleMessageProps = {
  message: string;
  onRetry?: () => void;
};

export function ScheduleMessage({ message, onRetry }: ScheduleMessageProps) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.root}>
      <Text variant="bodySmall" color="foregroundDefault" style={styles.text}>
        {message}
      </Text>
      {onRetry && <Button label="다시 시도" tone="weak" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.md, gap: spacing.sm },
  text: { textAlign: 'center' },
});
