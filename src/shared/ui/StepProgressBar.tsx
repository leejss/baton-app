import { StyleSheet, View } from 'react-native';

import { radius, useTheme } from '@/theme';

type StepProgressBarProps = {
  total: number;
  current: number;
};

const SPEC = {
  height: 6,
  gap: 7,
} as const;

export function StepProgressBar({ total, current }: StepProgressBarProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`${total}단계 중 ${current}단계`}
      accessibilityValue={{ min: 0, max: total, now: current }}
      style={styles.container}
    >
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              backgroundColor:
                index < current ? colors.surfaceBlueStrong : colors.surfaceBlueDefault,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPEC.gap,
  },
  bar: {
    flex: 1,
    height: SPEC.height,
    borderRadius: radius.full,
  },
});
