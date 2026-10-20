import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SCREEN_PADDING_X, useTheme } from '@/theme';

type BottomActionBarProps = {
  children: ReactNode;
  above?: ReactNode;
};

const SPEC = {
  paddingTop: 14,
  paddingBottom: 24,
} as const;

export function BottomActionBar({ children, above }: BottomActionBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    // 키보드가 열리면 이미 가려진 하단 안전영역만큼 보정한다.
    <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
      {above}

      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.backgroundDefault,
            paddingBottom: SPEC.paddingBottom + insets.bottom,
          },
        ]}
      >
        {children}
      </View>
    </KeyboardStickyView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPEC.paddingTop,
    paddingHorizontal: SCREEN_PADDING_X,
    boxShadow: '0px -2px 7px rgba(0, 0, 0, 0.04)',
  },
});
