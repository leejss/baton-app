import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { BottomActionBar, Box, Button, ScreenHeader, Text, textStyles } from '@/shared/ui';
import { SCREEN_PADDING_X } from '@/theme';

/**
 * 매장 참여 완료(STORE-04). Figma "03 매장 참여 완료" — `943:111826`.
 *
 * 참여가 끝난 뒤의 안내만 있는 화면이다. 진행 표시는 없다.
 */
export type StoreJoinedScreenProps = {
  onBack: () => void;
  /** "시작하기". 라우트가 홈으로 보낸다. */
  onStart: () => void;
};

const SPEC = {
  /** 헤더 ↔ 타이틀. */
  titleTop: 26,
  /** 타이틀 ↔ 일러스트. */
  illustrationTop: 40,
  /** 일러스트 크기(266×249). 에셋은 같은 프레임의 @2x 내보내기다. */
  illustrationWidth: 266,
  illustrationHeight: 249,
  /** 제목 ↔ 설명. */
  headlineGap: 12,
} as const;

export function StoreJoinedScreen({ onBack, onStart }: StoreJoinedScreenProps) {
  return (
    <Box background="backgroundDefault" style={styles.root}>
      <ScreenHeader onBack={onBack} />

      <View style={styles.content}>
        <View style={styles.headline}>
          <Text variant="display" weight="bold" style={textStyles.center}>
            워크스페이스에 참여했어요!
          </Text>
          <Text variant="body" weight="medium" color="foregroundDefault" style={textStyles.center}>
            이 워크스페이스에서 인수인계를 시작해보세요.
          </Text>
        </View>

        <Illustration />
      </View>

      <BottomActionBar>
        <Button label="시작하기" color="blue" onPress={onStart} />
      </BottomActionBar>
    </Box>
  );
}

/** 시안 "03 매장 참여 완료"의 일러스트. 장식이라 스크린리더에서 숨긴다. */
function Illustration() {
  return (
    <Image
      source={require('@/assets/images/stores/store-joined.png')}
      style={styles.illustration}
      contentFit="contain"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING_X,
    paddingTop: SPEC.titleTop,
  },
  headline: {
    gap: SPEC.headlineGap,
  },
  illustration: {
    width: SPEC.illustrationWidth,
    height: SPEC.illustrationHeight,
    marginTop: SPEC.illustrationTop,
    alignSelf: 'center',
  },
});
