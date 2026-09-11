import type {
  HandoffDto,
  MemberDto,
  RecipientRecommendationDto,
} from '@/features/handoffs/api/handoff.schema';

import { MOCK_STORE_MEMBERS } from '@/test/fixtures/members';

export const CURRENT_USER_ID = 1;
export const CURRENT_STORE_ID = 101;

// 인수인계 UI의 기존 문자열 ID 경계에서만 변환한다.
export const MOCK_MEMBERS: MemberDto[] = MOCK_STORE_MEMBERS.map((member) => ({
  ...member,
  userId: member.userId,
}));

const [me, minju, seojun, hayoon] = MOCK_MEMBERS;

if (me === undefined || minju === undefined || seojun === undefined || hayoon === undefined) {
  throw new Error('인수인계 mock 구성원 데이터가 올바르지 않습니다.');
}

const recipient = (user: MemberDto, confirmedAt?: string) => ({
  user,
  status: 'ACTIVE' as const,
  ...(confirmedAt === undefined ? {} : { confirmedAt }),
});

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const INITIAL_MOCK_HANDOFFS: HandoffDto[] = [
  {
    id: 101,
    type: 'WORK_TASK',
    title: '마감 정산 확인 부탁드려요',
    body: '포스 마감 금액과 현금 시재가 맞는지 한 번 더 확인해 주세요.',
    sender: me,
    recipient: recipient(minju),
    status: 'UNCONFIRMED',
    sentAt: minutesAgo(12),
    attachments: [],
  },
  {
    id: 102,
    type: 'STORE_STATUS',
    title: '제빙기 상태 확인 필요',
    body: '제빙기 소음이 평소보다 커졌습니다. 오픈 전에 상태 확인 부탁드립니다.',
    sender: seojun,
    recipient: recipient(me),
    status: 'UNCONFIRMED',
    sentAt: minutesAgo(70),
    attachments: [],
  },
  {
    id: 103,
    type: 'OTHER',
    title: '단골 고객 예약 문의',
    body: '오후 3시 단체 주문 문의가 있었습니다. 재연락 예정입니다.',
    sender: me,
    recipient: recipient(seojun, minutesAgo(180)),
    status: 'CONFIRMED',
    sentAt: minutesAgo(240),
    attachments: [],
  },
  {
    id: 104,
    type: 'WORK_TASK',
    title: '냉장고 발주 목록 공유',
    body: '우유와 휘핑크림은 발주 완료했습니다.',
    sender: minju,
    recipient: recipient(me, minutesAgo(1_300)),
    status: 'CONFIRMED',
    sentAt: minutesAgo(1_440),
    attachments: [],
  },
  {
    id: 105,
    type: 'STORE_STATUS',
    title: '창고 선반 정리 완료',
    body: '창고 선반 정리를 마쳤습니다.',
    sender: minju,
    recipient: recipient(hayoon),
    status: 'UNCONFIRMED',
    sentAt: minutesAgo(2_880),
    attachments: [],
  },
];

const recommendedStartAt = new Date(Date.now() + 2 * 60 * 60_000).toISOString();

export const MOCK_RECIPIENT_RECOMMENDATION: RecipientRecommendationDto = {
  recommended: minju,
  recommendedStartAt,
  candidates: [minju, seojun, hayoon],
};
