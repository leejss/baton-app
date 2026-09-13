import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { useTheme, type ThemeColorName } from '@/theme';

/**
 * 짧은 라벨 칩. Figma `chips_역할`(1169:30119)을 옮긴 것이다.
 *
 * 누르는 물건이 아니라 **상태·역할을 읽는 표시**다. 탭이 필요하면 이 컴포넌트를
 * `Pressable`로 감싸지 말고 버튼(`ButtonRounded`)을 쓰는 게 맞다 —
 * 시안에서 둘은 높이도 배색도 다르다.
 *
 * ⚠️ 시안에 정의된 톤이 주황 하나뿐이다(`tag/surface/soft/orange`).
 * 역할이 관리자·직원으로 나뉘므로 톤이 더 필요해 보이는데 아직 시안에 없다.
 * 색이 추가되면 `TONES`에만 넣으면 된다.
 *
 * @example
 * <Chip label="관리자" />
 * <Chip label="신규" size="sm" />
 * <Chip label="마감" size="xs" leftIcon={<ClockIcon />} />
 */
export type ChipTone = 'orange';

/** 시안 그대로. `md`가 가장 크다(24). */
export type ChipSize = 'md' | 'sm' | 'xs';

export type ChipProps = Omit<ViewProps, 'style' | 'children'> & {
  label: string;
  tone?: ChipTone;
  size?: ChipSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

/**
 * 사이즈별 글자. 여백(좌우 6·상하 2)은 전 사이즈 공통이라 아래 `styles`에 둔다.
 *
 * `sm`과 `xs`는 크기가 같고 굵기만 다르다 — 시안이 그렇게 정의돼 있다.
 * 즉 `xs`는 "더 작은 칩"이 아니라 "덜 강조된 칩"이다.
 */
const SIZES = {
  md: { text: 'bodySmall', weight: 'bold' },
  sm: { text: 'caption', weight: 'bold' },
  xs: { text: 'caption', weight: 'medium' },
} as const satisfies Record<ChipSize, { text: 'bodySmall' | 'caption'; weight: 'bold' | 'medium' }>;

const TONES: Record<ChipTone, { background: ThemeColorName; label: ThemeColorName }> = {
  orange: { background: 'tagSurfaceSoftOrange', label: 'tagForegroundOrange' },
};

export function Chip({
  label,
  tone = 'orange',
  size = 'md',
  leftIcon,
  rightIcon,
  ...rest
}: ChipProps) {
  const { colors } = useTheme();
  const skin = TONES[tone];
  const metrics = SIZES[size];

  return (
    <View style={[styles.base, { backgroundColor: colors[skin.background] }]} {...rest}>
      {leftIcon}
      <Text variant={metrics.text} weight={metrics.weight} color={skin.label}>
        {label}
      </Text>
      {rightIcon}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    /**
     * 시안 4. `radius` 스케일(8/12/20)에 없는 값이다. 칩만 쓰는 값이라 스케일을
     * 늘리지 않고 여기 둔다 — 다른 곳에서도 4가 필요해지면 그때 토큰으로 올린다.
     */
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    /** 시안 `2xs`. */
    gap: 4,
    alignSelf: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
  },
});
