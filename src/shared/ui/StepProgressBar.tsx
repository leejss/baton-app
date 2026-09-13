import { StyleSheet, View } from 'react-native';

import { radius, useTheme } from '@/theme';

/**
 * 단계형 진행 표시. 시안 `Progress bar`(`881:28274`) — 같은 폭의 막대 n개를 7 간격으로
 * 늘어놓고 지나온 단계까지 채운다.
 *
 * 채운 막대는 `surface/blue/strong`, 빈 막대는 `surface/blue/default`를 사용한다.
 */
export type StepProgressBarProps = {
  /** 전체 단계 수. */
  total: number;
  /** 현재 단계(1부터). 이 단계까지 채운다. */
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
