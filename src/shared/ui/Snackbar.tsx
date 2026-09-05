import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { radius, useTheme } from '@/theme';

/**
 * 화면 하단에 뜨는 알림. 시안 `Snackbar`(357×82)를 따른다.
 *
 * ⚠️ 시안에 나온 배색은 danger 하나뿐이라 톤도 하나만 구현했다.
 * 다른 톤(성공·안내)이 필요하면 디자인 시스템의 Snackbar 컴포넌트 세트를 먼저 확인할 것.
 */
export type SnackbarProps = {
  title: string;
  description?: string;
  /** 오른쪽 텍스트 버튼. 생략하면 버튼 없이 메시지만 보여준다. */
  actionLabel?: string;
  onAction?: () => void;
};

const SPEC = {
  paddingVertical: 12,
  paddingHorizontal: 16,
  /** 아이콘 ↔ 메시지 ↔ 액션 사이. */
  gap: 8,
  /** 제목 ↔ 설명. */
  messageGap: 4,
  iconSize: 24,
} as const;

export function Snackbar({ title, description, actionLabel, onAction }: SnackbarProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        { backgroundColor: colors.dangerSurface, borderColor: colors.dangerBorder },
      ]}
    >
      <Image
        style={styles.icon}
        source={require('@/assets/images/icon-alert-circle.png')}
        contentFit="contain"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />

      <View style={styles.message}>
        <Text variant="bodyStrong">{title}</Text>
        {description !== undefined && (
          <Text variant="captionSmall" color="textTertiary">
            {description}
          </Text>
        )}
      </View>

      {actionLabel !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          hitSlop={SPEC.paddingVertical}
        >
          <Text variant="captionStrong" color="danger">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: SPEC.paddingVertical,
    paddingHorizontal: SPEC.paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPEC.gap,
  },
  icon: { width: SPEC.iconSize, height: SPEC.iconSize },
  /** 메시지가 길어지면 이 블록만 늘어나고 아이콘·액션은 제자리를 지킨다. */
  message: { flex: 1, gap: SPEC.messageGap },
});
