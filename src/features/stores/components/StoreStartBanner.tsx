import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable, Text } from '@/shared/ui';
import { useTheme, type ThemeColorName } from '@/theme';

/**
 * 진입 선택 화면의 큰 선택 버튼. Figma `Banner Button`(`920:38218`) — 162×227.
 *
 * 두 장을 나란히 놓아 한 줄을 채우므로 폭은 부모가 정한다(`flex: 1`).
 * 시안은 두 배색을 쓴다 — 왼쪽(매장 생성)이 옅은 파랑, 오른쪽(참여)이 꽉 찬 파랑이다.
 */
export type StoreStartBannerTone = 'solid' | 'soft';

export type StoreStartBannerProps = {
  tone: StoreStartBannerTone;
  /** 99×99 자리에 들어가는 일러스트. */
  illustration: ReactNode;
  title: string;
  /** 두 줄로 끊어 쓴다. 줄바꿈은 호출부가 `\n`으로 넣는다. */
  description: string;
  onPress: () => void;
};

const SPEC = {
  height: 227,
  /**
   * 시안 `xl`(24). 우리 radius 스케일(8·12·20)에 없는 값이라 여기 둔다 —
   * 디자인 시스템 정리 때 스케일에 올릴지 결정한다.
   */
  borderRadius: 24,
  /** 가운데 정렬되는 콘텐츠 폭. */
  contentWidth: 114,
  /** 일러스트 크기(99×99). 아트워크가 오면 이 자리만 교체한다. */
  illustrationSize: 99,
  /** 일러스트 ↔ 문구. */
  textTop: 12,
  /** 제목 ↔ 설명. */
  textGap: 6,
  /** 시안: 설명 불투명도 90%. */
  descriptionOpacity: 0.9,
} as const;

const TONES: Record<StoreStartBannerTone, { background: ThemeColorName; text: ThemeColorName }> = {
  solid: { background: 'surfaceBlueStrong', text: 'foregroundInverse' },
  soft: { background: 'surfaceBlueDefault', text: 'foregroundBlueDefault' },
};

export function StoreStartBanner({
  tone,
  illustration,
  title,
  description,
  onPress,
}: StoreStartBannerProps) {
  const { colors } = useTheme();
  const skin = TONES[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description.replace('\n', ' ')}`}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors[skin.background] }]}
    >
      <View style={styles.content}>
        <View
          style={styles.illustration}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {illustration}
        </View>

        <View style={styles.text}>
          <Text variant="title" weight="bold" color={skin.text} style={styles.center}>
            {title}
          </Text>
          <Text
            variant="caption"
            weight="medium"
            color={skin.text}
            style={[styles.center, styles.description]}
          >
            {description}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: SPEC.height,
    borderRadius: SPEC.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    width: SPEC.contentWidth,
    alignItems: 'center',
  },
  illustration: {
    width: SPEC.illustrationSize,
    height: SPEC.illustrationSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: SPEC.textTop,
    gap: SPEC.textGap,
    alignSelf: 'stretch',
  },
  description: { opacity: SPEC.descriptionOpacity },
  center: { textAlign: 'center' },
});
