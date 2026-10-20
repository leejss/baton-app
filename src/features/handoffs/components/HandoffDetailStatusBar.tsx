import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomActionBar, Text } from '@/shared/ui';
import { useTheme } from '@/theme';

type HandoffDetailStatusBarProps = {
  label: string;
  above?: ReactNode;
};

export function HandoffDetailStatusBar({ label, above }: HandoffDetailStatusBarProps) {
  const theme = useTheme();

  return (
    <BottomActionBar above={above}>
      <View style={[styles.status, { backgroundColor: theme.colors.surfaceNeutralDisabled }]}>
        <Text weight="semibold" color="foregroundDisabled">
          {label}
        </Text>
      </View>
    </BottomActionBar>
  );
}

const styles = StyleSheet.create({
  status: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
