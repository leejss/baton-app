import { StyleSheet, View } from 'react-native';

import { Text, textStyles } from '@/shared/ui/Text';
import { spacing } from '@/theme';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text variant="display" weight="bold" style={textStyles.center}>
        {title}
      </Text>
      {description !== undefined && (
        <Text color="textSecondary" style={textStyles.center}>
          {description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
