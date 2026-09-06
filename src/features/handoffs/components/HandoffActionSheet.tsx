import { BottomSheetModal, BottomSheetView } from '@expo/ui/community/bottom-sheet';
import { type Ref, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Pressable, Text } from '@/shared/ui';
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
  const { width: viewportWidth } = useWindowDimensions();
  const sheetRef = useRef<BottomSheetModal>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      // 네이티브 시트의 나머지 명령은 기능 호출부에 노출하지 않는다.
      present: () => {
        pendingActionRef.current = null;
        sheetRef.current?.present();
      },
    }),
    [],
  );

  const handleDismiss = useCallback(() => {
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;

    // 다음 화면이나 확인 모달은 네이티브 시트의 퇴장 전환이 끝난 뒤 연다.
    onDismiss?.();
    pendingAction?.();
  }, [onDismiss]);

  const handleClose = () => {
    sheetRef.current?.dismiss();
  };

  const handleEdit = () => {
    pendingActionRef.current = onEdit;
    sheetRef.current?.dismiss();
  };

  const handleDelete = () => {
    pendingActionRef.current = onDelete;
    sheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      backgroundStyle={{ backgroundColor: theme.colors.background }}
      enablePanDownToClose
      handleComponent={null}
      onDismiss={handleDismiss}
    >
      <BottomSheetView
        // Expo UI의 fit-to-content가 가로축도 고유 크기로 측정하므로 뷰포트 너비를 명시한다.
        style={[styles.sheet, { backgroundColor: theme.colors.background, width: viewportWidth }]}
      >
        <View style={[styles.menu, { backgroundColor: theme.colors.surfaceSunken }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="인수인계 수정"
            onPress={handleEdit}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <EditFill />
            <Text weight="medium">수정하기</Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="인수인계 삭제"
            onPress={handleDelete}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <Trash color="danger" />
            <Text weight="medium" color="danger">
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
            { backgroundColor: theme.colors.surfaceSunken },
            pressed && styles.pressed,
          ]}
        >
          <X />
          <Text weight="medium">닫기</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): 바텀시트의 20px 상단 여백·56px 행 높이를 컴포넌트 토큰으로 동기화한다.
  sheet: {
    paddingHorizontal: spacing.md,
    paddingTop: 20,
    gap: spacing.sm,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
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
