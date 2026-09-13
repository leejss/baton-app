import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/shared/ui';
import { spacing } from '@/theme';

type ScheduleMessageProps = {
  message: string;
  onRetry?: () => void;
  isLoading?: boolean;
};

/** 화면을 교체하지 않고 해당 데이터 영역 안에서만 오류·진행 상태를 표시한다. */
export function ScheduleMessage({ message, onRetry, isLoading }: ScheduleMessageProps) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.root}>
      <Text variant="bodySmall" color="foregroundDefault" style={styles.text}>
        {message}
      </Text>
      {onRetry && (
        <Button label="다시 시도" variant="secondary" onPress={onRetry} isLoading={isLoading} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.md, gap: spacing.sm },
  text: { textAlign: 'center' },
});
