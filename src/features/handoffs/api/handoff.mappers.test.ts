import { describe, expect, it } from '@jest/globals';

import {
  toCreateRequest,
  toHandoffCardModel,
  toHandoffDetailModel,
  toHandoffScopeDto,
  toRecipientModels,
} from '@/features/handoffs/api/mappers';
import {
  CURRENT_USER_ID,
  INITIAL_MOCK_HANDOFFS,
  MOCK_MEMBERS,
  MOCK_RECIPIENT_RECOMMENDATION,
} from '@/test/fixtures/handoffs';

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
    expect(toHandoffCardModel(ownUnconfirmed, CURRENT_USER_ID)).toMatchObject({
      canManage: true,
      direction: 'sent',
    });
    expect(toHandoffCardModel(receivedUnconfirmed, CURRENT_USER_ID)).toMatchObject({
      canManage: false,
      direction: 'received',
    });
    expect(toHandoffCardModel(ownConfirmed, CURRENT_USER_ID)).toMatchObject({
      canManage: false,
      direction: 'sent',
    });
    expect(
      toHandoffCardModel(ownUnconfirmed, CURRENT_USER_ID, new Date(), 'received').canManage,
    ).toBe(false);
  });

  it('당사자가 아닌 매장 전체 항목은 상세를 열 수 없게 한다', () => {
    const thirdParty = INITIAL_MOCK_HANDOFFS.find(({ id }) => id === 105);
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
            id: 501,
            purpose: 'HANDOVER',
            contentType: 'image/jpeg',
            sizeBytes: 100,
            status: 'LINKED',
            downloadUrl: 'https://example.com/photo.jpg',
          },
          {
            id: 502,
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
      participantLabel: '이서연님께',
      statusActionLabel: '확인중',
      canManage: true,
      attachments: [
        { id: '501', uri: 'https://example.com/photo.jpg' },
        { id: '502', uri: '' },
      ],
    });
  });

  it.each(['UNCONFIRMED', 'CONFIRMED', 'TERMINATED'] as const)(
    '%s 상태에서도 조회자 기준으로 발신자 또는 수신자 이름을 표시한다',
    (status) => {
      const handoff = { ...receivedUnconfirmed, status };
      expect(toHandoffDetailModel(handoff, handoff.recipient.user.userId).participantLabel).toBe(
        '박현우님 보냄',
      );
      expect(toHandoffDetailModel(handoff, handoff.sender.userId).participantLabel).toBe(
        '김지원님께',
      );
    },
  );

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
            attachmentId: 501,
            uploadStatus: 'complete',
          },
        ],
      }),
    ).toEqual({
      type: 'WORK_TASK',
      title: '마감 확인',
      body: '시재를 확인해 주세요.',
      recipientId: recipient.userId,
      attachmentIds: [501],
    });
  });

  it('서버 후보만 표시하고 후보에 없는 근무 시각을 만들어 넣지 않는다', () => {
    const recipients = toRecipientModels(
      { ...MOCK_RECIPIENT_RECOMMENDATION, candidates: [MOCK_MEMBERS[1]] },
      CURRENT_USER_ID,
    );

    expect(recipients).toEqual([
      { member: MOCK_MEMBERS[1], isRecommended: true, nextShiftLabel: undefined },
    ]);
  });

  it('후보에 본인이나 탈퇴한 직원이 포함되어도 선택 목록에서 제외한다', () => {
    const recipients = toRecipientModels(
      {
        candidates: [MOCK_MEMBERS[0], MOCK_MEMBERS[1], { ...MOCK_MEMBERS[2], status: 'LEFT' }],
      },
      CURRENT_USER_ID,
    );

    expect(recipients.map(({ member }) => member.userId)).toEqual([MOCK_MEMBERS[1].userId]);
  });

  it.each([
    ['2026-09-26T15:00:00Z', '일요일 00:00 - 미정'],
    ['2026-09-27T06:00:00Z', '일요일 15:00 - 미정'],
  ])('서울 기준 요일과 시작 시간을 표시하고 종료시간은 미정으로 둔다: %s', (startAt, label) => {
    const recipients = toRecipientModels(
      { candidates: [{ ...MOCK_MEMBERS[1], startAt }] },
      CURRENT_USER_ID,
    );

    expect(recipients[0]?.nextShiftLabel).toBe(label);
  });

  it.each([
    ['2026-09-27T06:00:00Z', '2026-09-27T09:00:00Z', '일요일 15:00 - 18:00'],
    ['2026-09-27T15:00:00+09:00', '2026-09-27T18:00:00+09:00', '일요일 15:00 - 18:00'],
    ['2026-09-26T15:00:00Z', '2026-09-26T18:00:00Z', '일요일 00:00 - 03:00'],
    ['2026-09-27T06:00:00Z', null, '일요일 15:00 - 미정'],
  ])('후보의 시작·종료 시각을 서울 기준으로 표시한다: %s → %s', (startAt, endAt, label) => {
    const recipients = toRecipientModels(
      { candidates: [{ ...MOCK_MEMBERS[1], startAt, endAt }] },
      CURRENT_USER_ID,
    );

    expect(recipients[0]?.nextShiftLabel).toBe(label);
    expect(recipients[0]?.member).toEqual(MOCK_MEMBERS[1]);
  });
});
