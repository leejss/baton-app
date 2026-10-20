import { Image } from 'expo-image';
import { StyleSheet, type StyleProp, type ViewStyle, View } from 'react-native';

import { ILLUST_ICON_ASSETS, type IllustIconName } from '@/shared/ui/illustIconAssets';

type IllustIconProps = {
  /** Figma `Illust Icon` 에셋 이름. */
  name: IllustIconName;
  /** 아이콘이 차지하는 정사각형 프레임 크기(픽셀). 생략하면 에셋의 기본 크기를 사용한다. */
  size?: number;
  /** 아이콘 자체가 의미를 전달할 때만 지정한다. 생략하면 장식용으로 처리한다. */
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * 색상과 모양이 고정된 Figma 일러스트 아이콘.
 * 일반 글리프와 달리 색상 prop을 열지 않으며, 로컬 SVG 원본을 그대로 그린다.
 */
export function IllustIcon({ name, size, label, style }: IllustIconProps) {
  const asset = ILLUST_ICON_ASSETS[name];
  const frameSize = size ?? asset.frameSize;
  const scale = frameSize / asset.frameSize;
  const isDecorative = label === undefined;

  return (
    <View
      accessible={!isDecorative}
      accessibilityLabel={label}
      accessibilityRole={isDecorative ? undefined : 'image'}
      accessibilityElementsHidden={isDecorative}
      importantForAccessibility={isDecorative ? 'no-hide-descendants' : 'yes'}
      style={[styles.frame, { width: frameSize, height: frameSize }, style]}
    >
      <Image
        source={asset.source}
        contentFit="fill"
        style={{ width: asset.imageWidth * scale, height: asset.imageHeight * scale }}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
});
