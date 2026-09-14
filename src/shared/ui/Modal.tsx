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
/**
 * 시안의 두 배리언트. 치수가 달라서 한 컴포넌트 안에서 분기한다.
 *   icon  `modal-1 / 아이콘 강조형`(`530:17681`) — 260 폭, 50 아이콘. 짧은 감성 피드백.
 *   text  `modal-2 / 텍스트 강조형 / 단일형`(`90:1342`) — 300 폭, 40 아이콘. 본문이 다소 길 때(최대 3줄).
 */
type ModalVariant = 'icon' | 'text';

export type ModalProps = {
  isVisible: boolean;
  variant?: ModalVariant;
  /** 상단 강조 아이콘. 시안 기준 50×50. */
  icon?: ReactNode;
  title: string;
  /** 1~2줄 권장. 줄바꿈은 호출부가 `\n`으로 넣는다. */
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  /**
   * 닫기(X)와 안드로이드 뒤로가기. 생략하면 닫기 버튼을 감추고 뒤로가기로도 닫히지 않는다 —
   * 확인 외에 빠져나갈 길이 없어야 하는 경우에 그렇게 쓴다.
   */
  onClose?: () => void;
};

const SPEC = {
  padding: 18,
  /** 본문 묶음 ↔ 버튼. */
  gap: 22,
  /** 제목 ↔ 설명. */
  textGap: 6,
  /** 시안: 24 원 안에 13px 글리프. */
  closeSize: 24,
  closeIconSize: 14,
} as const;

/** 배리언트별로 다른 치수. */
const VARIANT_SPEC: Record<ModalVariant, { width: number; contentGap: number }> = {
  /** 시안: 393 프레임에서 좌우 67씩 비운 260. 아이콘 ↔ 텍스트 16. */
  icon: { width: 260, contentGap: 16 },
  /** 시안: 좌우 46씩 비운 300. 아이콘 ↔ 텍스트 22. */
  text: { width: 300, contentGap: 22 },
};

export const MODAL_ICON_SIZE = 50;
/** `variant="text"`의 아이콘 크기. */
export const MODAL_TEXT_ICON_SIZE = 40;

export function Modal({
  isVisible,
  variant = 'icon',
  icon,
  title,
  description,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
  onClose,
}: ModalProps) {
  const { colors } = useTheme();
  const variantSpec = VARIANT_SPEC[variant];

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlayDimmed }]}>
        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[
            styles.card,
            shadows.default,
            { width: variantSpec.width, backgroundColor: colors.backgroundDefault },
          ]}
        >
          <View>
            {onClose !== undefined && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="닫기"
                onPress={onClose}
                // 24pt라 최소 터치 영역(44)에 못 미친다. 여백으로 채운다.
                hitSlop={(44 - SPEC.closeSize) / 2}
                style={[styles.close, { backgroundColor: colors.surfaceNeutralSubtle }]}
              >
                <X size={SPEC.closeIconSize} color="foregroundSubtle" />
              </Pressable>
            )}

            <View style={[styles.content, { gap: variantSpec.contentGap }]}>
              {icon}
              <View style={styles.textGroup}>
                <Text variant="subheading" weight="semibold">
                  {title}
                </Text>
                {description !== undefined && (
                  <Text variant="bodySmall" color="foregroundDefault" style={styles.description}>
                    {description}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <Button label={confirmLabel} onPress={onConfirm} disabled={confirmDisabled} />
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
  content: { alignItems: 'center' },
  textGroup: { alignItems: 'center', gap: SPEC.textGap },
  description: { textAlign: 'center' },
});
