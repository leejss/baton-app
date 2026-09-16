import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/Text';
import { AlertCircleFill, CheckSquare } from '@/shared/ui/icons';
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
  tone?: 'warning' | 'success';
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

export function Snackbar({
  title,
  description,
  tone = 'warning',
  actionLabel,
  onAction,
}: SnackbarProps) {
  const { colors } = useTheme();
  const StatusIcon = tone === 'success' ? CheckSquare : AlertCircleFill;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          backgroundColor:
            tone === 'success' ? colors.surfaceSuccessSoft : colors.surfaceWarningSoft,
          borderColor:
            tone === 'success' ? colors.borderSuccessDefault : colors.borderWarningDefault,
        },
      ]}
    >
      <StatusIcon
        size={SPEC.iconSize}
        color={tone === 'success' ? 'foregroundSuccessDefault' : 'foregroundWarningDefault'}
      />

      <View style={styles.message}>
        <Text variant="body" weight="semibold" style={styles.title}>
          {title}
        </Text>
        {description !== undefined && (
          <Text variant="caption" weight="medium" color="foregroundSubtle">
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
          <Text variant="bodySmall" weight="bold" color="foregroundWarningDefault">
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
  /** 메시지가 길어지면 이 블록만 늘어나고 아이콘·액션은 제자리를 지킨다. */
  message: { flex: 1, gap: SPEC.messageGap },
  title: { opacity: 0.88 },
});
