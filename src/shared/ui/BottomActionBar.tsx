import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SCREEN_PADDING_X, useTheme } from '@/theme';

/**
 * 화면 하단에 고정되는 주 액션 영역. 시안 `Bottom Action Bar`(393×120)를 따른다.
 *
 * 시안의 120은 [상단 여백 14 + 버튼 48 + 하단 여백 24 + 홈 인디케이터 34]다.
 * 인디케이터 몫은 safe-area inset에 맡기고 나머지만 직접 그린다.
 */
export type BottomActionBarProps = {
  children: ReactNode;
};

const SPEC = {
  paddingTop: 14,
  /** 홈 인디케이터(34)를 뺀 값. 실제 inset은 아래에서 더한다. */
  paddingBottom: 24,
} as const;

export function BottomActionBar({ children }: BottomActionBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: SPEC.paddingBottom + insets.bottom,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPEC.paddingTop,
    paddingHorizontal: SCREEN_PADDING_X,
    /**
     * 시안의 그림자는 위로 뻗는다(offset y -2, blur 7, 검정 4%).
     * `boxShadow`는 iOS·Android 모두에서 같은 값으로 그려져서 elevation 분기가 필요 없다.
     */
    boxShadow: '0px -2px 7px rgba(0, 0, 0, 0.04)',
  },
});
