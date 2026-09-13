import { Pressable, StyleSheet, View } from 'react-native';

import { Check } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

/**
 * 체크박스. 시안 `Icon/check box`(`307:5299`)의 미선택 상태를 옮겼다 —
 * 흰 바닥에 1.4pt 회색 테두리, 안쪽 정사각형이 슬롯의 약 90%.
 *
 * ⚠️ 회원가입 시안(`943:111541`)에는 선택 상태 프레임이 없다. 선택 상태는
 * `surfaceBlueStrong` 바닥에 `foregroundInverse` 체크를 올린다.
 *
 * 라벨은 받지 않는다. 라벨과 함께 눌리는 행 전체는 호출부(`TermsCheckItem` 등)가 Pressable로
 * 감싸고, 이 컴포넌트는 `onToggle`을 생략하면 순수 표시용이 된다.
 */
export type CheckboxProps = {
  isChecked: boolean;
  /** 생략하면 장식(표시 전용)이 되어 접근성 트리에서 빠진다. */
  onToggle?: () => void;
  accessibilityLabel?: string;
  /** 슬롯 한 변. 시안은 전체 동의 34, 개별 항목 28. */
  size?: number;
};

const SPEC = {
  /** 슬롯 대비 안쪽 사각형 비율(25.5/28). */
  boxRatio: 0.9,
  borderWidth: 1.5,
  /** 안쪽 사각형 대비 체크 글리프 비율. */
  iconRatio: 0.85,
} as const;

export function Checkbox({ isChecked, onToggle, accessibilityLabel, size = 28 }: CheckboxProps) {
  const { colors } = useTheme();

  const boxSize = Math.round(size * SPEC.boxRatio);
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
