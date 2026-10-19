import { expect, it } from '@jest/globals';
import {
  toCreateRequest,
  toHandoffCardModel,
  toHandoffDetailModel,
  toRecipientModels,
} from '@/features/handoffs/api/mappers';
import { INITIAL_MOCK_HANDOFFS, MOCK_MEMBERS } from '@/test/fixtures/handoffs';
it('보낸 사람·담당자가 아닌 멤버도 상세를 열되 수정 권한은 얻지 않는다', () => {
  const item = INITIAL_MOCK_HANDOFFS[0];
  expect(toHandoffCardModel(item, 999)).toMatchObject({ canOpenDetail: true, canManage: false });
  expect(toHandoffDetailModel(item, 999).canManage).toBe(false);
  expect(toHandoffCardModel(item, item.sender.userId).canManage).toBe(true);
  expect(toHandoffCardModel({ ...item, status: 'CONFIRMED' }, item.sender.userId).canManage).toBe(
    false,
  );
});
it('담당자 후보는 활성 멤버 중 본인을 제외하고 이름순으로 제공한다', () => {
  const candidates = toRecipientModels(
    [...MOCK_MEMBERS, { ...MOCK_MEMBERS[1], userId: 999, status: 'LEFT' }],
    1,
  );
  expect(candidates.every(({ member }) => member.userId !== 1 && member.status === 'ACTIVE')).toBe(
    true,
  );
  expect(candidates.map(({ member }) => member.displayName)).toEqual(
    candidates.map(({ member }) => member.displayName).sort((a, b) => a.localeCompare(b, 'ko')),
  );
});
it('직접 선택한 한 명만 생성 요청에 담고 담당자가 없으면 거절한다', () => {
  const draft = {
    type: 'WORK_TASK' as const,
    title: '제목',
    body: '내용',
    attachments: [],
    recipient: { member: MOCK_MEMBERS[1] },
  };
  expect(toCreateRequest(draft).recipientId).toBe(MOCK_MEMBERS[1].userId);
  expect(() => toCreateRequest({ ...draft, recipient: null })).toThrow();
});
