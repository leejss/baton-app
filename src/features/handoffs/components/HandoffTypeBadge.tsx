import { StyleSheet, View } from 'react-native';

import { HandoffTypeIcon } from '@/features/handoffs/components/HandoffTypeIcon';
import { Text } from '@/shared/ui';

type HandoffTypeBadgeProps = {
  label: string;
};

export function HandoffTypeBadge({ label }: HandoffTypeBadgeProps) {
  return (
    <View style={styles.root}>
      <HandoffTypeIcon size={16} tone="accent" />
      <Text variant="bodySmall" weight="semibold" color="accent">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: 42,
    backgroundColor: '#F1F6FF',
    overflow: 'hidden',
    // TODO(design-system): Figma 732:22073의 blue surface·10px 여백·42px radius를 토큰화한다.
  },
});
