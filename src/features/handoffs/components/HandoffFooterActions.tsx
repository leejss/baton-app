import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable, Text } from '@/shared/ui';
import { radius, spacing, useTheme } from '@/theme';

type HandoffFooterActionsProps = {
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
};

export function HandoffFooterActions({
  primaryLabel,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
}: HandoffFooterActionsProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isPrimaryDisabled = primaryDisabled || primaryLoading;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      {secondaryLabel !== undefined && onSecondaryPress !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
          onPress={onSecondaryPress}
          style={[styles.button, styles.secondary, { backgroundColor: theme.colors.surfaceSunken }]}
        >
          <Text weight="medium">{secondaryLabel}</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        accessibilityState={{ disabled: isPrimaryDisabled, busy: primaryLoading }}
        disabled={isPrimaryDisabled}
        onPress={onPrimaryPress}
        style={({ pressed }) => [
          styles.button,
          styles.primary,
          { backgroundColor: theme.colors.accent },
          (pressed || isPrimaryDisabled) && styles.dimmed,
        ]}
      >
        <Text weight="semibold" color="accentOn">
          {primaryLoading ? '처리 중' : primaryLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    // TODO(design-system): 작성 플로우 하단 고정 영역의 12px 상단 여백을 토큰화한다.
  },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { flex: 1 },
  primary: { flex: 2 },
  dimmed: { opacity: 0.4 },
});
