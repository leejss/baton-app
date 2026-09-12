import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/shared/ui';
import { BoxMultipleFill } from '@/shared/ui/icons';
import { radius, useTheme } from '@/theme';

/**
 * 초대 코드 표시·복사 카드. Figma "02 매장 생성 완료"(`943:112106`)의 파란 카드다.
 *
 * 계약상 코드는 **숫자 4자리**이고 발급 후 24시간 유효하다(`api-spec.md` §3).
 * 재발급은 이 카드의 역할이 아니다 — 시안이 "설정에서 언제든 새 코드를 발급할 수
 * 있어요"라고 안내하므로 재발급 버튼은 설정 화면에만 둔다.
 */
export type InvitationCodeCardProps = {
  /** 숫자 4자리 초대 코드. */
  code: string;
  onCopy: () => void;
};

const SPEC = {
  paddingHorizontal: 18,
  paddingVertical: 12,
  /** 라벨 ↔ 코드 행. */
  gap: 2,
  copyIconSize: 16,
} as const;

export function InvitationCodeCard({ code, onCopy }: InvitationCodeCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.accentSoft }]}>
      <Text variant="bodySmall" weight="semibold" color="textTertiary">
        초대코드
      </Text>

      <View style={styles.row}>
        {/* 코드 자체를 읽어줘야 한다. 숫자를 붙여 읽으면 "삼천육백팔십삼"이 되므로 띄운다. */}
        <Text
          variant="displayLarge"
          weight="bold"
          color="accent"
          accessibilityLabel={`초대코드 ${code.split('').join(' ')}`}
        >
          {code}
        </Text>

        <Button
          label="코드 복사"
          color="blue"
          size="sm"
          onPress={onCopy}
          leftIcon={<BoxMultipleFill size={SPEC.copyIconSize} color="accentOn" />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    paddingHorizontal: SPEC.paddingHorizontal,
    paddingVertical: SPEC.paddingVertical,
    gap: SPEC.gap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
