import { BottomSheetModal, BottomSheetView } from '@expo/ui/community/bottom-sheet';
import { type ReactNode, useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/shared/ui/Pressable';
import { Text } from '@/shared/ui/Text';
import { X } from '@/shared/ui/icons';
import { spacing, useTheme } from '@/theme';

export type BottomSheetProps = {
  visible: boolean;
  children: ReactNode;
  title?: string;
  /** 근무자 선택 시안의 설명과 상단 배치. */
  description?: string;
  dismissible?: boolean;
  /** 닫기 전환이 끝난 뒤 호출된다. 여기서 visible을 false로 갱신한다. */
  onDismiss: () => void;
};

/** 콘텐츠 높이에 맞는 네이티브 시트. 닫힐 때까지 마운트를 유지한다. */
export function BottomSheet({
  visible,
  children,
  title,
  description,
  dismissible = true,
  onDismiss,
}: BottomSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      // Android에서도 hide()의 완료를 기다리도록 index 대신 명령을 사용한다.
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleClose = () => {
    if (dismissible) sheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      backgroundStyle={{ backgroundColor: colors.backgroundDefault }}
      enablePanDownToClose={dismissible}
      handleComponent={null}
      onDismiss={onDismiss}
    >
      <BottomSheetView
        style={[
          styles.content,
          description !== undefined && styles.selectionContent,
          {
            backgroundColor: colors.backgroundDefault,
            // fit-to-content 측정 중에는 백분율 너비의 기준이 없으므로 숫자로 전달한다.
            width,
            maxHeight: height - insets.top - spacing.md,
          },
        ]}
      >
        {description !== undefined && (
          <View style={[styles.handle, { backgroundColor: colors.borderDefault }]} />
        )}
        {title && (
          <View style={styles.heading}>
            <View style={[styles.title, description !== undefined && styles.descriptionGroup]}>
              <Text accessibilityRole="header" variant="subheading" weight="semibold">
                {title}
              </Text>
              {description !== undefined && (
                <Text variant="bodySmall" color="foregroundSubtle">
                  {description}
                </Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${title} 닫기`}
              accessibilityState={{ disabled: !dismissible }}
              disabled={!dismissible}
              onPress={handleClose}
              style={[styles.close, description !== undefined && styles.selectionClose]}
            >
              <View
                style={
                  description !== undefined && [
                    styles.closeCircle,
                    { backgroundColor: colors.surfaceNeutralSubtle },
                  ]
                }
              >
                <X size={description !== undefined ? 16 : 20} color="foregroundDisabled" />
              </View>
            </Pressable>
          </View>
        )}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  // Figma 1097:39086의 화면 전용 치수.
  selectionContent: { paddingTop: 46, paddingHorizontal: 20, gap: 25 },
  descriptionGroup: { gap: 6 },
  handle: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: 60,
    height: 4,
    borderRadius: 12,
  },
  selectionClose: { position: 'absolute', top: -36, right: -10 },
  closeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.md,
    // 기존 인수인계 시트의 여백을 유지한다. TODO(design-system): 20px를 토큰과 동기화한다.
    paddingTop: 20,
    // 하단 안전영역과 키보드 대응은 네이티브 시트가 담당한다.
    gap: spacing.md,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
