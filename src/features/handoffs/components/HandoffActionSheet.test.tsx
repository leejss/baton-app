import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { createRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  HandoffActionSheet,
  type HandoffActionSheetMethods,
} from '@/features/handoffs/components/HandoffActionSheet';

jest.mock('@expo/ui/community/bottom-sheet', () =>
  jest.requireActual('@/shared/ui/__mocks__/expoBottomSheet'),
);

const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, right: 0, bottom: 34, left: 0 },
};

afterEach(async () => {
  await cleanup();
});

describe('인수인계 액션 시트', () => {
  it.each(['인수인계 수정', '인수인계 삭제', '닫기'])(
    '%s은 시트가 닫힌 뒤 처리한다',
    async (label) => {
      const ref = createRef<HandoffActionSheetMethods>();
      const onDismiss = jest.fn();
      const onEdit = jest.fn();
      const onDelete = jest.fn();
      await render(
        <SafeAreaProvider initialMetrics={metrics}>
          <HandoffActionSheet ref={ref} onDismiss={onDismiss} onEdit={onEdit} onDelete={onDelete} />
        </SafeAreaProvider>,
      );
      await act(() => ref.current?.present());
      await fireEvent.press(screen.getByLabelText(label));
      expect(onDismiss).not.toHaveBeenCalled();
      expect(onEdit).not.toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();

      await fireEvent(screen.getByLabelText('닫기'), 'onDismiss');
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledTimes(label === '인수인계 수정' ? 1 : 0);
      expect(onDelete).toHaveBeenCalledTimes(label === '인수인계 삭제' ? 1 : 0);
      expect(screen.queryByLabelText('닫기')).not.toBeOnTheScreen();

      await act(() => ref.current?.present());
      await fireEvent.press(screen.getByLabelText('닫기'));
      await fireEvent(screen.getByLabelText('닫기'), 'onDismiss');
      expect(onEdit).toHaveBeenCalledTimes(label === '인수인계 수정' ? 1 : 0);
      expect(onDelete).toHaveBeenCalledTimes(label === '인수인계 삭제' ? 1 : 0);
    },
  );
});
