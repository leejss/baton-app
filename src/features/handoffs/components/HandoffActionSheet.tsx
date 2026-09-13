import { type Ref, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable, Text } from '@/shared/ui';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { EditFill, Trash, X } from '@/shared/ui/icons';
import { radius, spacing, useTheme } from '@/theme';

export type HandoffActionSheetMethods = {
  present: () => void;
};

type HandoffActionSheetProps = {
  ref?: Ref<HandoffActionSheetMethods>;
  onDismiss?: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

export function HandoffActionSheet({ ref, onDismiss, onDelete, onEdit }: HandoffActionSheetProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      // 네이티브 시트의 나머지 명령은 기능 호출부에 노출하지 않는다.
      present: () => {
        pendingActionRef.current = null;
        setVisible(true);
      },
    }),
    [],
  );

  const handleDismiss = () => {
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;
    setVisible(false);

    // 다음 화면이나 확인 모달은 네이티브 시트의 퇴장 전환이 끝난 뒤 연다.
    onDismiss?.();
    pendingAction?.();
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleEdit = () => {
    pendingActionRef.current = onEdit;
    setVisible(false);
  };

  const handleDelete = () => {
    pendingActionRef.current = onDelete;
    setVisible(false);
  };

  return (
    <BottomSheet visible={visible} onDismiss={handleDismiss}>
      <View style={styles.actions}>
        <View style={[styles.menu, { backgroundColor: theme.colors.surfaceNeutralSubtle }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="인수인계 수정"
            onPress={handleEdit}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <EditFill />
            <Text weight="medium">수정하기</Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.colors.borderDefault }]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="인수인계 삭제"
            onPress={handleDelete}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <Trash color="foregroundWarningDefault" />
            <Text weight="medium" color="foregroundWarningDefault">
              삭제하기
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          onPress={handleClose}
          style={({ pressed }) => [
            styles.close,
            { backgroundColor: theme.colors.surfaceNeutralSubtle },
            pressed && styles.pressed,
          ]}
        >
          <X />
          <Text weight="medium">닫기</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): 바텀시트의 56px 행 높이를 컴포넌트 토큰으로 동기화한다.
  actions: { gap: spacing.sm },
  menu: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
  },
  close: {
    minHeight: 56,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.72 },
});
