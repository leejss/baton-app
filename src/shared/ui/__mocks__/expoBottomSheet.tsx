import type { BottomSheetProps } from '@expo/ui/community/bottom-sheet';
import { useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';

/**
 * Jest에는 별도 네이티브 창이 없어 실제 Host의 pointerEvents="none"이 시트 안까지
 * 전파된다. 네이티브 경계만 대체하고 닫기 완료는 테스트가 명시적으로 전달한다.
 */
export function BottomSheetModal({
  ref,
  children,
  onDismiss,
  enablePanDownToClose,
}: BottomSheetProps) {
  const [visible, setVisible] = useState(false);
  const closing = useRef(false);
  useImperativeHandle(ref, () => {
    const present = () => {
      closing.current = false;
      setVisible(true);
    };
    const dismiss = () => {
      if (visible) closing.current = true;
    };
    return {
      present,
      dismiss,
      close: dismiss,
      forceClose: dismiss,
      expand: present,
      collapse: present,
      snapToIndex: present,
      snapToPosition: present,
    };
  }, [visible]);

  if (!visible) return null;
  const nativeEvents = {
    onDismiss: () => {
      if (!closing.current) return;
      closing.current = false;
      setVisible(false);
      onDismiss?.();
    },
    onIsPresentedChange: () => {
      if (enablePanDownToClose) closing.current = true;
    },
  };
  return <View {...nativeEvents}>{children}</View>;
}

export const BottomSheetView = View;
