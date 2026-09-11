import { StyleSheet, View } from 'react-native';

import { BottomActionBar, Pressable, Text } from '@/shared/ui';
import { useTheme } from '@/theme';
import { palette } from '@/theme/tokens';

type HandoffFooterActionsProps = {
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryTone?: 'accent' | 'neutral';
  secondaryLabel?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
};

export function HandoffFooterActions({
  primaryLabel,
  primaryDisabled = false,
  primaryLoading = false,
  primaryTone = 'neutral',
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
}: HandoffFooterActionsProps) {
  const theme = useTheme();
  const isPrimaryDisabled = primaryDisabled || primaryLoading;
  const primaryBackground = primaryTone === 'accent' ? theme.colors.accent : palette.gray800;

  return (
    <BottomActionBar>
      <View style={styles.actions}>
        {secondaryLabel !== undefined && onSecondaryPress !== undefined && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={secondaryLabel}
            disabled={primaryLoading}
            accessibilityState={{ disabled: primaryLoading }}
            onPress={onSecondaryPress}
            style={({ pressed }) => [
              styles.button,
              styles.secondary,
              { backgroundColor: theme.colors.surfaceSunken },
              pressed && styles.pressed,
            ]}
          >
            <Text weight="semibold" style={styles.secondaryLabel}>
              {secondaryLabel}
            </Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
          accessibilityState={{
            disabled: isPrimaryDisabled,
            busy: primaryLoading,
          }}
          disabled={isPrimaryDisabled}
          onPress={onPrimaryPress}
          style={({ pressed }) => [
            styles.button,
            styles.primary,
            { backgroundColor: primaryBackground },
            (pressed || isPrimaryDisabled) && styles.dimmed,
          ]}
        >
          <Text weight="semibold" color="accentOn">
            {primaryLoading ? '처리 중' : primaryLabel}
          </Text>
        </Pressable>
      </View>
    </BottomActionBar>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    // TODO(design-system): Figma 732:21495의 버튼 사이 10px 간격을 spacing 토큰과 동기화한다.
  },
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // TODO(design-system): Action Button의 8px radius는 현재 radius 스케일에 없어 원시값을 사용한다.
  },
  secondary: { width: 89 },
  primary: { flex: 1 },
  // TODO(design-system): Figma foreground/subtle 색상이 시맨틱 컬러에 추가되면 원시값을 교체한다.
  secondaryLabel: { color: '#9CA3AF' },
  pressed: { opacity: 0.72 },
  dimmed: { opacity: 0.4 },
});
