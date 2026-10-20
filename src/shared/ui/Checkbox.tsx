import { Pressable, StyleSheet, View } from 'react-native';

import { Check } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

type CheckboxProps = {
  isChecked: boolean;
  onToggle?: () => void;
  accessibilityLabel?: string;
  size?: number;
};

const SPEC = {
  boxSize: 25.5,
  borderWidth: 1.5,
  iconRatio: 0.85,
} as const;

export function Checkbox({ isChecked, onToggle, accessibilityLabel, size = 28 }: CheckboxProps) {
  const { colors } = useTheme();

  // 슬롯이 박스보다 작게 들어오면 슬롯에 맞춘다.
  const boxSize = Math.min(SPEC.boxSize, size);
  const isInteractive = onToggle !== undefined;

  const box = (
    <View
      style={[
        styles.box,
        {
          width: boxSize,
          height: boxSize,
          backgroundColor: isChecked ? colors.surfaceBlueStrong : colors.backgroundDefault,
          borderColor: isChecked ? colors.surfaceBlueStrong : colors.borderStrong,
        },
      ]}
    >
      {isChecked && <Check size={Math.round(boxSize * SPEC.iconRatio)} color="foregroundInverse" />}
    </View>
  );

  // 상위 행이 눌리는 경우 체크박스는 장식으로만 표시한다.
  if (!isInteractive) {
    return (
      <View
        style={[styles.slot, { width: size, height: size }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {box}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: isChecked }}
      onPress={onToggle}
      // 슬롯이 28~34라 최소 터치 영역 44에 못 미친다. hitSlop으로 채운다.
      hitSlop={Math.max(0, (44 - size) / 2)}
      style={[styles.slot, { width: size, height: size }]}
    >
      {box}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    borderWidth: SPEC.borderWidth,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
