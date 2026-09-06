import { describe, expect, it } from '@jest/globals';

import {
  toCreateRequest,
  toHandoffCardModel,
  toHandoffDetailModel,
  toHandoffScopeDto,
  toRecipientModels,
} from '@/features/handoffs/api/handoff.mappers';
import {
  CURRENT_USER_ID,
  INITIAL_MOCK_HANDOFFS,
  MOCK_NEXT_SHIFT_BY_USER_ID,
  MOCK_RECIPIENT_RECOMMENDATION,
} from '@/features/handoffs/api/mockHandoffData';

const [ownUnconfirmed, receivedUnconfirmed, ownConfirmed] = INITIAL_MOCK_HANDOFFS;

if (
  ownUnconfirmed === undefined ||
  receivedUnconfirmed === undefined ||
  ownConfirmed === undefined
) {
  throw new Error('인수인계 mapper 테스트용 데이터가 올바르지 않습니다.');
}

describe('handoff mapper', () => {
  it('UI 탭 값을 API scope 값으로 변환한다', () => {
    expect(toHandoffScopeDto('all')).toBe('ALL');
    expect(toHandoffScopeDto('received')).toBe('RECEIVED');
    expect(toHandoffScopeDto('sent')).toBe('SENT');
  });

  it('본인이 보낸 확인 전 항목에만 관리 권한을 준다', () => {
    expect(toHandoffCardModel(ownUnconfirmed, CURRENT_USER_ID).canManage).toBe(true);
    expect(toHandoffCardModel(receivedUnconfirmed, CURRENT_USER_ID).canManage).toBe(false);
    expect(toHandoffCardModel(ownConfirmed, CURRENT_USER_ID).canManage).toBe(false);
    expect(
      toHandoffCardModel(ownUnconfirmed, CURRENT_USER_ID, new Date(), 'received').canManage,
    ).toBe(false);
  });

  it('당사자가 아닌 매장 전체 항목은 상세를 열 수 없게 한다', () => {
    const thirdParty = INITIAL_MOCK_HANDOFFS.find(({ id }) => id === 'handoff-store-summary');
    expect(thirdParty).toBeDefined();
    if (thirdParty === undefined) return;

    expect(toHandoffCardModel(thirdParty, CURRENT_USER_ID).canOpenDetail).toBe(false);
  });

  it('상세 응답을 작성자 화면 모델로 변환한다', () => {
    const detail = toHandoffDetailModel(
      {
        ...ownUnconfirmed,
        attachments: [
          {
            id: 'attachment-visible',
            purpose: 'HANDOVER',
            contentType: 'image/jpeg',
            sizeBytes: 100,
            status: 'LINKED',
            downloadUrl: 'https://example.com/photo.jpg',
          },
          {
            id: 'attachment-hidden',
            purpose: 'HANDOVER',
            contentType: 'image/jpeg',
            sizeBytes: 100,
            status: 'LINKED',
          },
        ],
      },
      CURRENT_USER_ID,
      new Date(ownUnconfirmed.sentAt),
    );

    expect(detail).toMatchObject({
      typeLabel: '업무 처리',
      dateLabel: '오늘',
      recipientLabel: '박민주님께',
      statusActionLabel: '확인중',
      canManage: true,
      attachments: [{ id: 'attachment-visible', uri: 'https://example.com/photo.jpg' }],
    });
  });

  it('작성 요청의 문자열을 정리하고 검증된 첨부 ID만 보낸다', () => {
    const recipient = MOCK_RECIPIENT_RECOMMENDATION.candidates[0];
    expect(recipient).toBeDefined();
    if (recipient === undefined) return;

    expect(
      toCreateRequest({
        type: 'WORK_TASK',
        title: '  마감 확인  ',
        body: '  시재를 확인해 주세요.  ',
        recipient: {
          member: recipient,
          isRecommended: true,
          nextShiftLabel: '9. 6. 18:00',
        },
        attachments: [
          {
            localId: 'local-1',
            uri: 'file:///photo.jpg',
            fileName: 'photo.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: 100,
            width: 100,
            height: 100,
            attachmentId: 'attachment-1',
          },
          {
            localId: 'local-2',
            uri: 'file:///pending.jpg',
            fileName: 'pending.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: 100,
            width: 100,
            height: 100,
          },
        ],
      }),
    ).toEqual({
      type: 'WORK_TASK',
      title: '마감 확인',
      body: '시재를 확인해 주세요.',
      recipientId: recipient.userId,
      attachmentIds: ['attachment-1'],
    });
  });

  it('추천 정보와 mock 근무 시각을 화면 모델로 합친다', () => {
    const recipients = toRecipientModels(MOCK_RECIPIENT_RECOMMENDATION, MOCK_NEXT_SHIFT_BY_USER_ID);

    expect(recipients).toHaveLength(3);
    expect(recipients[0]).toMatchObject({ isRecommended: true });
    expect(recipients.every(({ nextShiftLabel }) => nextShiftLabel !== undefined)).toBe(true);
  });
});
