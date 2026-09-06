import { Pressable, StyleSheet, View } from 'react-native';

import { ArrowLeftS } from '@/shared/ui/icons';
import { SCREEN_PADDING_X, spacing } from '@/theme';

/**
 * 인증 플로우 공통 헤더. 시안 `IOS Navigation Bar`의 아래쪽 `Navigation Bar`(높이 62)다.
 *
 * 시작 화면은 뒤로가기가 없지만 헤더 높이는 그대로 차지한다 — 두 화면의 로고·제목이
 * 같은 높이에서 시작해야 전환할 때 튀지 않는다.
 */
export type AuthHeaderProps = {
  onBack?: () => void;
};

const HEIGHT = 62;
const ICON_SIZE = 24;

export function AuthHeader({ onBack }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      {onBack !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          onPress={onBack}
          // 아이콘이 24라 최소 터치 영역 44×44에 못 미친다. hitSlop으로 채운다.
          hitSlop={spacing.sm + 2}
        >
          <ArrowLeftS size={ICON_SIZE} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HEIGHT,
    paddingHorizontal: SCREEN_PADDING_X,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: { width: ICON_SIZE, height: ICON_SIZE },
});
