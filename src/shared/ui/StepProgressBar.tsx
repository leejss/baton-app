import { StyleSheet, View } from 'react-native';

import { radius, useTheme } from '@/theme';

/**
 * 단계형 진행 표시. 시안 `Progress bar`(`881:28274`) — 같은 폭의 막대 n개를 7 간격으로
 * 늘어놓고 지나온 단계까지 채운다.
 *
 * 채운 막대는 `surface/blue/strong`(#2563EB → `accent`), 빈 막대는 `surface/blue/default`.
 * ⚠️ 빈 막대의 #F1F6FF는 팔레트에 없다(blue50은 #EFF6FF). 같은 역할의 시맨틱 키
 * `accentSubtle`을 쓰고, 값 차이는 디자인 시스템 토큰 정리(baton-figma-token-mismatch)에서 푼다.
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
            { backgroundColor: index < current ? colors.accent : colors.accentSubtle },
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
