import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

import { TEXT_FIELD_ICON_SIZE } from '@/shared/ui';

export type PasswordToggleProps = {
  isVisible: boolean;
  onToggle: () => void;
};

/**
 * 비밀번호 표시 토글. `TextField`의 `rightIcon` 슬롯에 넣어 쓴다.
 *
 * ⚠️ 시안은 마스킹 상태(03-2)와 노출 상태(03-3)에 **같은 아이콘**을 쓴다. 그래서 여기도
 * 상태에 따라 아이콘을 바꾸지 않는다. 표시용 아이콘이 따로 나오면 그때 분기한다.
 */
export function PasswordToggle({ isVisible, onToggle }: PasswordToggleProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
      accessibilityState={{ selected: isVisible }}
      onPress={onToggle}
      hitSlop={10}
    >
      <Image
        style={styles.icon}
        source={require('@/assets/images/icon-eye-off.png')}
        contentFit="contain"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: { width: TEXT_FIELD_ICON_SIZE, height: TEXT_FIELD_ICON_SIZE },
});
