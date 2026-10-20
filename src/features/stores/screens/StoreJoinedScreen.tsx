import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { BottomActionBar, Box, Button, ScreenHeader, Text, textStyles } from '@/shared/ui';
import { SCREEN_PADDING_X } from '@/theme';

type StoreJoinedScreenProps = {
  onBack: () => void;
  onStart: () => void;
};

const SPEC = {
  titleTop: 26,
  illustrationTop: 40,
  illustrationWidth: 266,
  illustrationHeight: 249,
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

        <Image
          source={require('@/assets/images/stores/store-joined.png')}
          style={styles.illustration}
          contentFit="contain"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>

      <BottomActionBar>
        <Button label="시작하기" color="blue" onPress={onStart} />
      </BottomActionBar>
    </Box>
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
