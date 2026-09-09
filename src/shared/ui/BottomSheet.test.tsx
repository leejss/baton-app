import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Pressable } from '@/shared/ui/Pressable';
import { Text } from '@/shared/ui/Text';

jest.mock('@expo/ui/community/bottom-sheet', () =>
  jest.requireActual('@/shared/ui/__mocks__/expoBottomSheet'),
);

const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, right: 0, bottom: 34, left: 0 },
};

function SheetExample({
  onDismiss,
  dismissible = true,
}: {
  onDismiss: () => void;
  dismissible?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="열기"
        onPress={() => setVisible(true)}
      >
        <Text>열기</Text>
      </Pressable>
      <BottomSheet
        visible={visible}
        title="선택"
        dismissible={dismissible}
        onDismiss={() => {
          setVisible(false);
          onDismiss();
        }}
      >
        <Text>시트 내용</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="완료"
          onPress={() => setVisible(false)}
        >
          <Text>완료</Text>
        </Pressable>
      </BottomSheet>
    </SafeAreaProvider>
  );
}

afterEach(async () => {
  await cleanup();
});

describe('공용 네이티브 BottomSheet', () => {
  it.each(['선택 닫기', '완료'])('%s 이후 네이티브 전환이 끝날 때 닫기를 알린다', async (label) => {
    const onDismiss = jest.fn();
    await render(<SheetExample onDismiss={onDismiss} />);
    expect(screen.queryByText('시트 내용')).not.toBeOnTheScreen();
    expect(onDismiss).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('열기'));
    expect(screen.getByText('시트 내용')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText(label));
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByText('시트 내용')).toBeOnTheScreen();

    // Jest가 실행하지 않는 네이티브 전환의 완료 이벤트를 시트까지 전달한다.
    await fireEvent(screen.getByText('시트 내용'), 'onDismiss');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('시트 내용')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('열기'));
    expect(screen.getByText('시트 내용')).toBeOnTheScreen();
  });

  it('사용자가 시트를 끌어서 닫은 뒤 다시 열 수 있다', async () => {
    const onDismiss = jest.fn();
    await render(<SheetExample onDismiss={onDismiss} />);
    await fireEvent.press(screen.getByLabelText('열기'));
    await fireEvent(screen.getByText('시트 내용'), 'onIsPresentedChange', {
      nativeEvent: { isPresented: false },
    });
    expect(onDismiss).not.toHaveBeenCalled();
    await fireEvent(screen.getByText('시트 내용'), 'onDismiss');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByLabelText('열기'));
    expect(screen.getByText('시트 내용')).toBeOnTheScreen();
  });

  it('닫기가 비활성화되면 제목 옆 닫기 버튼도 비활성화한다', async () => {
    const onDismiss = jest.fn();
    await render(<SheetExample onDismiss={onDismiss} dismissible={false} />);
    await fireEvent.press(screen.getByLabelText('열기'));
    expect(screen.getByLabelText('선택 닫기')).toBeDisabled();
    await fireEvent.press(screen.getByLabelText('선택 닫기'));
    expect(screen.getByText('시트 내용')).toBeOnTheScreen();
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
