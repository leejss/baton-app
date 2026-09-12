import { StyleSheet, View } from 'react-native';

import type { HandoffTypeDto } from '@/features/handoffs/api/handoff.schema';
import { HANDOFF_TYPE_ILLUST_ICONS } from '@/features/handoffs/lib/handoffTypeIllustIcons';
import { IllustIcon, Text } from '@/shared/ui';

type HandoffTypeBadgeProps = {
  label: string;
  type: HandoffTypeDto;
};

export function HandoffTypeBadge({ label, type }: HandoffTypeBadgeProps) {
  return (
    <View style={styles.root}>
      <IllustIcon name={HANDOFF_TYPE_ILLUST_ICONS[type]} size={16} />
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
