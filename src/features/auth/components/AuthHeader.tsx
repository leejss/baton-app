import { Pressable, StyleSheet, View } from 'react-native';

import { ArrowLeftS } from '@/shared/ui/icons';
import { SCREEN_PADDING_X, spacing } from '@/theme';

type AuthHeaderProps = {
  onBack?: () => void;
  isBackDisabled?: boolean;
};

const HEIGHT = 62;
const ICON_SIZE = 24;

export function AuthHeader({ onBack, isBackDisabled = false }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      {onBack !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          accessibilityState={{ disabled: isBackDisabled }}
          disabled={isBackDisabled}
          onPress={onBack}
          // 아이콘이 24라 최소 터치 영역 44×44에 못 미친다. hitSlop으로 채운다.
          hitSlop={spacing.sm + 2}
        >
          <ArrowLeftS
            size={ICON_SIZE}
            color={isBackDisabled ? 'foregroundDisabled' : 'foregroundStrong'}
          />
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
});
