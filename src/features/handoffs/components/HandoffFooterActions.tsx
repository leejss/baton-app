import { StyleSheet, View } from 'react-native';

import { BottomActionBar, Pressable, Text } from '@/shared/ui';
import { useTheme } from '@/theme';

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
  const primaryBackground =
    primaryTone === 'accent' ? theme.colors.surfaceBlueStrong : theme.colors.surfaceNeutralStrong;

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
              { backgroundColor: theme.colors.surfaceNeutralSubtle },
              pressed && styles.pressed,
            ]}
          >
            <Text weight="semibold" color="foregroundDisabled">
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
          <Text weight="semibold" color="foregroundInverse">
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
  pressed: { opacity: 0.72 },
  dimmed: { opacity: 0.4 },
});
