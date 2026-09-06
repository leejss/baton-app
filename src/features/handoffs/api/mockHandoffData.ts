import type {
  HandoffDto,
  MemberDto,
  RecipientRecommendationDto,
} from '@/features/handoffs/api/handoff.schema';

export const CURRENT_USER_ID = 'user-me';
export const CURRENT_STORE_ID = 'store-baton';

export const MOCK_MEMBERS: MemberDto[] = [
  {
    userId: CURRENT_USER_ID,
    email: 'jiwoo@baton.app',
    displayName: '김지우',
    profileImage: { source: 'STATIC', key: 'DEFAULT_MANAGER' },
    role: 'MANAGER',
    status: 'ACTIVE',
  },
  {
    userId: 'user-minju',
    email: 'minju@baton.app',
    displayName: '박민주',
    profileImage: { source: 'STATIC', key: 'DEFAULT_EMPLOYEE' },
    role: 'EMPLOYEE',
    status: 'ACTIVE',
  },
  {
    userId: 'user-seojun',
    email: 'seojun@baton.app',
    displayName: '이서준',
    profileImage: { source: 'STATIC', key: 'DEFAULT_EMPLOYEE' },
    role: 'EMPLOYEE',
    status: 'ACTIVE',
  },
  {
    userId: 'user-hayoon',
    email: 'hayoon@baton.app',
    displayName: '최하윤',
    profileImage: { source: 'STATIC', key: 'DEFAULT_EMPLOYEE' },
    role: 'EMPLOYEE',
    status: 'ACTIVE',
  },
];

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
    id: 'handoff-own-unconfirmed',
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
    id: 'handoff-received-unconfirmed',
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
    id: 'handoff-own-confirmed',
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
    id: 'handoff-received-confirmed',
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
    id: 'handoff-store-summary',
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

export const MOCK_NEXT_SHIFT_BY_USER_ID: Readonly<Record<string, string>> = {
  [minju.userId]: formatMockShift(2),
  [seojun.userId]: formatMockShift(5),
  [hayoon.userId]: formatMockShift(26),
};

function formatMockShift(hoursFromNow: number): string {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60_000);
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
