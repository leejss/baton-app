import { StyleSheet, View } from 'react-native';

import type { HandoffTypeDto } from '@/features/handoffs/api/handoff.schema';
import { HANDOFF_TYPE_ILLUST_ICONS } from '@/features/handoffs/lib/handoffTypeIllustIcons';
import { IllustIcon, Text } from '@/shared/ui';
import { useTheme } from '@/theme';

type HandoffTypeBadgeProps = {
  label: string;
  type: HandoffTypeDto;
};

export function HandoffTypeBadge({ label, type }: HandoffTypeBadgeProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceBlueDefault }]}>
      <IllustIcon name={HANDOFF_TYPE_ILLUST_ICONS[type]} size={16} />
      <Text variant="bodySmall" weight="semibold" color="foregroundBlueSoft">
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
    overflow: 'hidden',
  },
});
