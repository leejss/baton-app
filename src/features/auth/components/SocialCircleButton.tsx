import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { radius, socialBrand, useTheme } from '@/theme';

/**
 * 로그인 화면의 원형 소셜 버튼. 시안 `Logo Button`(50×50).
 * 시작 화면의 가로 버튼(`StartButton`)과 같은 동작이지만 모양이 달라 별도 컴포넌트로 둔다.
 */
export type SocialCircleButtonProps = {
  provider: 'kakao' | 'apple';
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
};

const SIZE = 50;
/** 아이콘 크기는 시안이 카카오 32, Apple 36으로 다르게 잡았다. */
const ICON_SIZE = { kakao: 32, apple: 36 } as const;

export function SocialCircleButton({
  provider,
  label,
  onPress,
  isLoading = false,
  disabled = false,
}: SocialCircleButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || isLoading;

  const backgroundColor = provider === 'kakao' ? socialBrand.kakaoYellow : colors.textPrimary;
  const iconSize = ICON_SIZE[provider];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor },
        pressed && styles.pressed,
        isDisabled && !isLoading && styles.disabled,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={provider === 'kakao' ? colors.staticBlack : colors.staticWhite} />
      ) : (
        <Image
          style={{ width: iconSize, height: iconSize }}
          source={
            provider === 'kakao'
              ? require('@/assets/images/icon-kakao.png')
              : require('@/assets/images/icon-apple.png')
          }
          contentFit="contain"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
