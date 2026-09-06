import type { ReactNode } from 'react';
import { Modal as RNModal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/shared/ui/Button';
import { Text } from '@/shared/ui/Text';
import { X } from '@/shared/ui/icons';
import { radius, shadows, spacing, useTheme } from '@/theme';

/**
 * 확인 버튼 하나짜리 모달. 시안 `modal-1 / 아이콘 강조형`(`530:17681`)을 따른다.
 *
 * 시안의 사용 지침:
 *   1. 짧은 안내 메시지를 전달할 때 사용 (본문 1~2줄 권장)
 *   2. 아이콘이 크게 강조되어 감성적인 피드백에 적합
 *   3. 버튼 1개(단순 확인)로 구성
 *
 * 버튼이 둘 이상 필요하면 이 컴포넌트를 늘리지 말고 디자인 시스템의 다른 modal 배리언트를
 * 확인한다 — 시안에 여러 종류가 있고 치수가 서로 다르다.
 */
export type ModalProps = {
  isVisible: boolean;
  /** 상단 강조 아이콘. 시안 기준 50×50. */
  icon?: ReactNode;
  title: string;
  /** 1~2줄 권장. 줄바꿈은 호출부가 `\n`으로 넣는다. */
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
  /**
   * 닫기(X)와 안드로이드 뒤로가기. 생략하면 닫기 버튼을 감추고 뒤로가기로도 닫히지 않는다 —
   * 확인 외에 빠져나갈 길이 없어야 하는 경우에 그렇게 쓴다.
   */
  onClose?: () => void;
};

const SPEC = {
  /** 시안: 393 프레임에서 좌우 67씩 비운 260. */
  width: 260,
  padding: 18,
  /** 본문 묶음 ↔ 버튼. */
  gap: 22,
  /** 아이콘 ↔ 텍스트. */
  contentGap: 16,
  /** 제목 ↔ 설명. */
  textGap: 6,
  /** 시안: 24 원 안에 13px 글리프. */
  closeSize: 24,
  closeIconSize: 14,
} as const;

export const MODAL_ICON_SIZE = 50;

export function Modal({
  isVisible,
  icon,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: ModalProps) {
  const { colors } = useTheme();

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[styles.card, shadows.default, { backgroundColor: colors.background }]}
        >
          {onClose !== undefined && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              onPress={onClose}
              // 24pt라 최소 터치 영역(44)에 못 미친다. 여백으로 채운다.
              hitSlop={(44 - SPEC.closeSize) / 2}
              style={[styles.close, { backgroundColor: colors.surfaceSunken }]}
            >
              <X size={SPEC.closeIconSize} color="textTertiary" />
            </Pressable>
          )}

          <View style={styles.content}>
            {icon}
            <View style={styles.textGroup}>
              <Text variant="subheading" weight="semibold">
                {title}
              </Text>
              {description !== undefined && (
                <Text variant="bodySmall" color="textSecondary" style={styles.description}>
                  {description}
                </Text>
              )}
            </View>
          </View>

          <Button label={confirmLabel} onPress={onConfirm} />
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    width: SPEC.width,
    maxWidth: '100%',
    borderRadius: radius.md,
    padding: SPEC.padding,
    gap: SPEC.gap,
  },
  /** 닫기 버튼은 오른쪽 위. 본문은 아래에서 가운데 정렬한다. */
  close: {
    alignSelf: 'flex-end',
    width: SPEC.closeSize,
    height: SPEC.closeSize,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center', gap: SPEC.contentGap },
  textGroup: { alignItems: 'center', gap: SPEC.textGap },
  description: { textAlign: 'center' },
});
