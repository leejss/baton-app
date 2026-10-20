import { Pressable, StyleSheet, View } from 'react-native';

import { Checkbox, Text } from '@/shared/ui';
import { ArrowRightS } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

type TermsCheckItemProps = {
  variant: 'all' | 'item';
  prefix?: string;
  label: string;
  isChecked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onOpen?: () => void;
};

const SPEC = {
  all: {
    paddingHorizontal: 14,
    paddingVertical: 15,
    checkboxSize: 34,
  },
  item: {
    padding: 14,
    checkboxSize: 28,
    arrowSlot: 28,
    arrowSize: 24,
  },
  gap: 5,
  labelGap: 4,
} as const;

export function TermsCheckItem({
  variant,
  prefix,
  label,
  isChecked,
  disabled = false,
  onToggle,
  onOpen,
}: TermsCheckItemProps) {
  const { colors } = useTheme();

  const isAll = variant === 'all';
  const fullLabel = prefix === undefined ? label : `${prefix} ${label}`;
  // 시안: 개별 항목은 체크 전 foregroundDisabled이고, 전체 동의는 항상 진하다.
  const labelColor = isAll || isChecked ? 'foregroundStrong' : 'foregroundDisabled';

  return (
    <View
      style={[
        styles.row,
        isAll
          ? [styles.allRow, { backgroundColor: colors.surfaceNeutralSubtle }]
          : [
              styles.itemRow,
              {
                backgroundColor: colors.backgroundDefault,
                borderColor: colors.borderDefault,
              },
            ],
      ]}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={fullLabel}
        accessibilityState={{ checked: isChecked, disabled }}
        disabled={disabled}
        onPress={onToggle}
        style={styles.toggleArea}
      >
        <Checkbox
          isChecked={isChecked}
          size={isAll ? SPEC.all.checkboxSize : SPEC.item.checkboxSize}
        />
        <View style={styles.label}>
          {prefix !== undefined && (
            <Text variant="bodySmall" weight="medium" color={labelColor}>
              {prefix}
            </Text>
          )}
          <Text variant="bodySmall" weight="medium" color={labelColor} style={styles.labelText}>
            {label}
          </Text>
        </View>
      </Pressable>

      {onOpen !== undefined && (
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          accessibilityLabel={`${label} 내용 보기`}
          onPress={onOpen}
          // 28 슬롯이라 최소 터치 영역 44에 못 미친다. hitSlop으로 채운다.
          hitSlop={(44 - SPEC.item.arrowSlot) / 2}
          style={styles.arrowSlot}
        >
          <ArrowRightS size={SPEC.item.arrowSize} color="foregroundSubtle" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allRow: {
    borderRadius: radius.lg,
    paddingHorizontal: SPEC.all.paddingHorizontal,
    paddingVertical: SPEC.all.paddingVertical,
  },
  itemRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: SPEC.item.padding,
  },
  toggleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPEC.gap,
  },
  label: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPEC.labelGap,
  },
  labelText: { flexShrink: 1 },
  arrowSlot: {
    width: SPEC.item.arrowSlot,
    height: SPEC.item.arrowSlot,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
