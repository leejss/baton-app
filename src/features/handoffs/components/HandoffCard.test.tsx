import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { HandoffCard } from '@/features/handoffs/components/HandoffCard';
import type { HandoffCardModel } from '@/features/handoffs/model/handoff';

const baseItem: HandoffCardModel = {
  id: 'handoff-1',
  type: 'WORK_TASK',
  typeLabel: '업무 처리',
  title: '마감 정산 확인',
  dateLabel: '오늘',
  status: 'UNCONFIRMED',
  statusLabel: '확인 전',
  senderName: '김지우',
  recipientName: '박민주',
  canManage: true,
  canOpenDetail: true,
};

describe('HandoffCard', () => {
  it('관리 가능한 발신 카드에는 수정 및 삭제 메뉴를 표시한다', async () => {
    const onManagePress = jest.fn();
    await render(<HandoffCard item={baseItem} onPress={jest.fn()} onManagePress={onManagePress} />);

    fireEvent.press(screen.getByLabelText('마감 정산 확인 수정 및 삭제 메뉴'));
    expect(onManagePress).toHaveBeenCalledWith('handoff-1');
  });

  it('수신 카드와 확인 완료 발신 카드에는 관리 메뉴를 표시하지 않는다', async () => {
    const { rerender } = await render(
      <HandoffCard
        item={{ ...baseItem, canManage: false }}
        onPress={jest.fn()}
        onManagePress={jest.fn()}
      />,
    );

    expect(screen.queryByLabelText('마감 정산 확인 수정 및 삭제 메뉴')).toBeNull();

    rerender(
      <HandoffCard
        item={{ ...baseItem, status: 'CONFIRMED', statusLabel: '확인 완료', canManage: false }}
        onPress={jest.fn()}
        onManagePress={jest.fn()}
      />,
    );
    expect(screen.queryByLabelText('마감 정산 확인 수정 및 삭제 메뉴')).toBeNull();
  });
});
