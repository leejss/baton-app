import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SCREEN_PADDING_X, useTheme } from '@/theme';

/**
 * 화면 하단에 고정되는 주 액션 영역. 시안 `Bottom Action Bar`(393×120)를 따른다.
 *
 * 시안의 120은 [상단 여백 14 + 버튼 48 + 하단 여백 24 + 홈 인디케이터 34]다.
 * 인디케이터 몫은 safe-area inset에 맡기고 나머지만 직접 그린다.
 *
 * 키보드가 올라오면 바도 그 위로 따라 올라간다. iOS 키보드는 화면을 덮기만 해서
 * 그냥 두면 주 액션이 통째로 가리는데, `number-pad`처럼 완료 키가 없는 키보드에서는
 * 키보드를 내릴 방법조차 없어 버튼에 아예 닿지 못한다(초대 코드 입력 화면에서 발생).
 * 올라간 상태에서는 홈 인디케이터 몫을 키보드가 덮으므로 그만큼(`insets.bottom`)을 상쇄한다.
 */
export type BottomActionBarProps = {
  children: ReactNode;
  /** 바와 함께 올라와야 하는 요소(스낵바 등). 바 바로 위에 그린다. */
  above?: ReactNode;
};

const SPEC = {
  paddingTop: 14,
  /** 홈 인디케이터(34)를 뺀 값. 실제 inset은 아래에서 더한다. */
  paddingBottom: 24,
} as const;

export function BottomActionBar({ children, above }: BottomActionBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
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
    /**
     * 시안의 그림자는 위로 뻗는다(offset y -2, blur 7, 검정 4%).
     * `boxShadow`는 iOS·Android 모두에서 같은 값으로 그려져서 elevation 분기가 필요 없다.
     */
    boxShadow: '0px -2px 7px rgba(0, 0, 0, 0.04)',
  },
});
