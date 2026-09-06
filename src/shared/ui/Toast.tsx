import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { CheckSquare } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

/**
 * 하단에 잠깐 떠서 상태를 알리는 토스트. 시안 `Notification`(`73:6524`)의 메시지 한 줄짜리.
 *
 * 시안 지침: "상태에 대한 메시지를 안내할 때 사용. Auto Dismiss ON이면 타이머로 사라지고,
 * OFF면 사용자가 특정 행동을 완료해야 사라진다." 사라지는 시점은 호출부가 정한다 —
 * 이 컴포넌트는 그리기만 한다.
 *
 * 배경은 회색 반투명(`toastBackground`) 위에 iOS 블러가 얹힌 모습인데, 블러는 네이티브
 * 모듈 없이 못 그려서 반투명만 옮겼다. 전경은 테마와 무관하게 흰색이다.
 *
 * `Snackbar`(danger 톤, 액션 버튼)와 다른 컴포넌트다. 이쪽은 안내, 그쪽은 경고.
 */
export type ToastProps = {
  message: string;
};

const SPEC = {
  paddingVertical: 12,
  paddingHorizontal: 16,
  /** 아이콘 ↔ 메시지. */
  gap: 8,
  iconSize: 24,
  minHeight: 32,
  /** 시안: 메시지 텍스트 불투명도 88%. */
  messageOpacity: 0.88,
  maxWidth: 420,
} as const;

export function Toast({ message }: ToastProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.container, { backgroundColor: colors.toastBackground }]}
    >
      <CheckSquare size={SPEC.iconSize} color="staticWhite" />
      <Text variant="body" weight="semibold" color="staticWhite" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: SPEC.maxWidth,
    alignSelf: 'center',
    minHeight: SPEC.minHeight,
    borderRadius: radius.md,
    paddingVertical: SPEC.paddingVertical,
    paddingHorizontal: SPEC.paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPEC.gap,
    overflow: 'hidden',
  },
  message: {
    flex: 1,
    opacity: SPEC.messageOpacity,
  },
});
