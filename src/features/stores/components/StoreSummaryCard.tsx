import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui';
import { MapPinArea, Phone, User } from '@/shared/ui/icons';
import { radius, spacing, useTheme } from '@/theme';

/**
 * 매장 정보 요약 카드. Figma "02 매장 생성 완료"(`943:112087`)의 카드 영역이다.
 *
 * 라벨 열과 값 열을 각각 세로로 쌓아 **두 열의 베이스라인이 맞도록** 그린다.
 * 행마다 좌우로 배치하면 라벨 길이가 달라질 때 값 열이 들쭉날쭉해진다.
 */
export type StoreSummaryCardProps = {
  storeName: string;
  address: string;
  /**
   * 관리자 표시명. 시안은 `김*현`처럼 가운데를 가린 형태다.
   *
   * ⚠️ 계약의 `StoreInvitationPreview`에는 관리자 이름이 없다. 값을 모르는 화면에서는
   * 생략하고 행 자체를 그리지 않는다 — 빈 값을 그리면 정보가 비어 보인다.
   */
  managerName?: string;
  storeContact: string;
  /**
   * 카드 아래쪽에 구분선과 함께 붙는 영역. 초대 매장 확인 화면(`943:111819`)의
   * "확인해주세요" 안내가 여기 들어간다.
   */
  footer?: ReactNode;
};

const SPEC = {
  /** 카드 내부 여백. 좌우 18 / 상하 16. */
  paddingHorizontal: 18,
  paddingVertical: 16,
  /** 라벨 아이콘 ↔ 라벨 텍스트. */
  labelGap: 4,
  /** 행 사이. Figma `xs`(6) — 우리 spacing 스케일(4의 배수)에 없는 값이다. */
  rowGap: 6,
  iconSize: 14,
} as const;

type FieldProps = {
  icon: ReactNode;
  label: string;
};

function FieldLabel({ icon, label }: FieldProps) {
  return (
    <View style={styles.label}>
      {icon}
      <Text variant="bodySmall" weight="semibold" color="foregroundSubtle">
        {label}
      </Text>
    </View>
  );
}

export function StoreSummaryCard({
  storeName,
  address,
  managerName,
  storeContact,
  footer,
}: StoreSummaryCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { borderColor: colors.borderDefault, backgroundColor: colors.backgroundDefault },
      ]}
    >
      <Text variant="subheading" weight="bold">
        {storeName}
      </Text>

      <View style={styles.body}>
        <View style={styles.column}>
          <FieldLabel
            icon={<MapPinArea size={SPEC.iconSize} color="foregroundSubtle" />}
            label="주소"
          />
          {managerName !== undefined && (
            <FieldLabel
              icon={<User size={SPEC.iconSize} color="foregroundSubtle" />}
              label="관리자"
            />
          )}
          <FieldLabel
            icon={<Phone size={SPEC.iconSize} color="foregroundSubtle" />}
            label="연락처"
          />
        </View>

        <View style={[styles.column, styles.values]}>
          <Text variant="bodySmall" color="foregroundDefault">
            {address}
          </Text>
          {managerName !== undefined && (
            <Text variant="bodySmall" color="foregroundDefault">
              {managerName}
            </Text>
          )}
          <Text variant="bodySmall" color="foregroundDefault">
            {storeContact}
          </Text>
        </View>
      </View>

      {footer !== undefined && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />
          {footer}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: SPEC.paddingHorizontal,
    paddingVertical: SPEC.paddingVertical,
    gap: spacing.md,
  },
  body: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  column: {
    gap: SPEC.rowGap,
  },
  /** 주소가 길면 줄바꿈돼야 한다. 라벨 열은 고정, 값 열만 남은 폭을 갖는다. */
  values: {
    flex: 1,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPEC.labelGap,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
