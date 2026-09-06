import { StyleSheet, View } from 'react-native';

import { BottomActionBar, Text } from '@/shared/ui';
import { useTheme } from '@/theme';

type HandoffDetailStatusBarProps = {
  label: string;
};

export function HandoffDetailStatusBar({ label }: HandoffDetailStatusBarProps) {
  const theme = useTheme();

  return (
    <BottomActionBar>
      <View style={[styles.status, { backgroundColor: theme.colors.surfaceDisabled }]}>
        <Text weight="semibold" color="textDisabled">
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
    // TODO(design-system): Action Button의 8px radius는 현재 radius 스케일에 없어 원시값을 사용한다.
  },
});
