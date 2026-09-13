import { Pressable, StyleSheet, View } from 'react-native';

import { Checkbox, Text } from '@/shared/ui';
import { ArrowRightS } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

/**
 * 약관 동의 행. 시안 `List_checklist`(`943:111553`)와 배경형 `List_checklist/Default/bg`
 * (`943:111549`, 전체 동의) 두 모양을 `variant`로 가른다.
 *
 * 행 전체가 체크 토글이고, 오른쪽 화살표만 약관 본문 열기다.
 */
export type TermsCheckItemProps = {
  variant: 'all' | 'item';
  /** "[필수]"·"[선택]" 같은 접두. 생략하면 라벨만 그린다. */
  prefix?: string;
  label: string;
  isChecked: boolean;
  onToggle: () => void;
  /** 주면 오른쪽에 화살표가 생기고 약관 본문을 연다. 전체 동의 행에는 없다. */
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
    /** 화살표 슬롯. 24 아이콘이 28 슬롯 가운데 놓인다. */
    arrowSlot: 28,
    arrowSize: 24,
  },
  /** 체크박스 ↔ 라벨. */
  gap: 5,
  /** 접두 ↔ 라벨. */
  labelGap: 4,
} as const;

export function TermsCheckItem({
  variant,
  prefix,
  label,
  isChecked,
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
              { backgroundColor: colors.backgroundDefault, borderColor: colors.borderDefault },
            ],
      ]}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={fullLabel}
        accessibilityState={{ checked: isChecked }}
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
  /** 체크박스와 라벨을 한 덩어리로 눌리게 한다. 남는 폭까지 전부 터치 영역이다. */
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
