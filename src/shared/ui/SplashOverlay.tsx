import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { SPLASH_WORDMARK_ASPECT_RATIO, SPLASH_WORDMARK_WIDTH } from '@/theme/splash';
import { palette } from '@/theme/tokens';

const DURATION = 600;

// 렌더마다 새로 만들지 않도록 모듈 스코프에 둔다.
const fadeOutKeyframe = new Keyframe({
  0: { transform: [{ scale: 1 }], opacity: 1 },
  20: { opacity: 1 },
  70: { opacity: 0, easing: Easing.elastic(0.7) },
  100: { opacity: 0, transform: [{ scale: 1 }], easing: Easing.elastic(0.7) },
});

/**
 * 네이티브 스플래시를 감추고 JS 스플래시로 자연스럽게 이어붙인다.
 * 첫 레이아웃이 끝난 뒤에 감추므로 흰 화면 깜빡임이 없다.
 */
export function SplashOverlay() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const image = (
    <Image
      style={styles.wordmark}
      source={require('@/assets/images/splash-wordmark.png')}
      contentFit="contain"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );

  if (!isAnimating) {
    return (
      <View
        style={styles.overlay}
        onLayout={() => {
          SplashScreen.hideAsync().finally(() => setIsAnimating(true));
        }}
      >
        {image}
      </View>
    );
  }

  return (
    <Animated.View
      style={styles.overlay}
      entering={fadeOutKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setIsVisible, false);
        }
      })}
    >
      {image}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    // 스플래시는 테마와 무관하게 항상 브랜드 색이므로 원시 토큰을 직접 참조한다.
    backgroundColor: palette.splashBackground,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  wordmark: {
    width: SPLASH_WORDMARK_WIDTH,
    aspectRatio: SPLASH_WORDMARK_ASPECT_RATIO,
  },
});
