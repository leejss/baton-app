import type {
  HandoverListItemDto,
  MemberDto,
  ScheduleDto,
  UserProfileDto,
} from '@/features/home/api/home.schema';
import { HomeDataSourceError, type HomeDataSource } from '@/features/home/api/home.dataSource';
import { getTodayInSeoul } from '@/features/home/lib/homeDate';

type MockHomeDataSourceOptions = {
  alreadyConfirmedOnConfirmIds?: number[];
  confirmFailureIds?: number[];
  contextFailure?: boolean;
  handoffs?: HandoverListItemDto[];
  homeFailure?: boolean;
  notificationFailure?: boolean;
  receivedHandoverCount?: number;
  scheduleFactory?: (date: string) => ScheduleDto[];
  unreadCount?: number;
};

const SUCCESS_META = { result: 'SUCCESS', errorCode: null, message: null } as const;

const CURRENT_USER: UserProfileDto = {
  id: 1,
  email: 'jiwon@baton.app',
  displayName: '김지원',
  profileImage: { source: 'STATIC', key: 'DEFAULT_MANAGER' },
  status: 'ACTIVE',
};

const CURRENT_MEMBER: MemberDto = {
  userId: CURRENT_USER.id,
  email: CURRENT_USER.email,
  displayName: CURRENT_USER.displayName,
  profileImage: CURRENT_USER.profileImage,
  role: 'MANAGER',
  status: 'ACTIVE',
};

function getTodayAt(hour: number, minute: number): string {
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return new Date(`${getTodayInSeoul()}T${time}:00+09:00`).toISOString();
}

const EMPLOYEES: MemberDto[] = [
  {
    userId: 2,
    email: 'seoyeon@baton.app',
    displayName: '이서연',
    profileImage: { source: 'STATIC', key: 'DEFAULT_EMPLOYEE' },
    role: 'EMPLOYEE',
    status: 'ACTIVE',
  },
  {
    userId: 3,
    email: 'hyunwoo@baton.app',
    displayName: '박현우',
    profileImage: { source: 'STATIC', key: 'DEFAULT_EMPLOYEE' },
    role: 'EMPLOYEE',
    status: 'ACTIVE',
  },
  {
    userId: 4,
    email: 'minji@baton.app',
    displayName: '최민지',
    profileImage: { source: 'STATIC', key: 'DEFAULT_EMPLOYEE' },
    role: 'EMPLOYEE',
    status: 'ACTIVE',
  },
];

const DEFAULT_HANDOFFS: HandoverListItemDto[] = [
  {
    id: 301,
    type: 'WORK_TASK',
    title: '마감 정산 영수증 확인',
    sender: EMPLOYEES[0]!,
    recipient: { user: CURRENT_MEMBER, status: 'ACTIVE', confirmedAt: getTodayAt(22, 20) },
    status: 'CONFIRMED',
    sentAt: getTodayAt(22, 10),
  },
  {
    id: 302,
    type: 'STORE_STATUS',
    title: '신규 재고 위치 확인',
    sender: EMPLOYEES[1]!,
    recipient: { user: CURRENT_MEMBER, status: 'ACTIVE' },
    status: 'UNCONFIRMED',
    sentAt: getTodayAt(21, 10),
  },
  {
    id: 303,
    type: 'OTHER',
    title: '오픈 전 기기 상태 확인',
    sender: EMPLOYEES[2]!,
    recipient: { user: CURRENT_MEMBER, status: 'ACTIVE' },
    status: 'UNCONFIRMED',
    sentAt: getTodayAt(20, 10),
  },
];

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted === true) {
    throw new DOMException('요청이 취소됐습니다.', 'AbortError');
  }
}

function createDefaultSchedules(date: string): ScheduleDto[] {
  return EMPLOYEES.map((employee, index) => ({
    id: 201 + index,
    employee,
    workDate: date,
    startTime: [`17:00`, `18:00`, `19:00`][index]!,
    endTime: [`21:00`, `22:00`, `23:00`][index]!,
    status: 'ACTIVE',
  }));
}

/** OpenAPI의 `meta + data` 모양을 유지하는 앱 내부 mock 서버다. */
export function createMockHomeDataSource(options: MockHomeDataSourceOptions = {}): HomeDataSource {
  const handoffs = options.handoffs ?? DEFAULT_HANDOFFS;
  const statusById = new Map(handoffs.map((handoff) => [handoff.id, handoff.status]));

  return {
    async getMyProfile(signal) {
      assertNotAborted(signal);

      if (options.contextFailure === true) {
        throw new HomeDataSourceError(
          'HOME_CONTEXT_UNAVAILABLE',
          '홈 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
        );
      }

      return { meta: SUCCESS_META, data: CURRENT_USER };
    },

    async getMyStore(signal) {
      assertNotAborted(signal);

      if (options.contextFailure === true) {
        throw new HomeDataSourceError(
          'HOME_CONTEXT_UNAVAILABLE',
          '홈 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
        );
      }

      return {
        meta: SUCCESS_META,
        data: {
          membership: {
            store: {
              id: 101,
              storeName: '카페 바톤',
              branchName: '강남점',
              address: '서울시 강남구 테헤란로 1',
              storeContact: '02-1234-5678',
              status: 'ACTIVE',
              createdAt: '2026-01-01T00:00:00Z',
            },
            role: 'MANAGER',
            status: 'ACTIVE',
          },
        },
      };
    },

    async getHome(_storeId, date, signal) {
      assertNotAborted(signal);

      if (options.homeFailure === true) {
        throw new HomeDataSourceError(
          'HOME_SUMMARY_UNAVAILABLE',
          '홈 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
        );
      }

      return {
        meta: SUCCESS_META,
        data: {
          date,
          schedulePreview: (options.scheduleFactory ?? createDefaultSchedules)(date),
          receivedHandoverCount: options.receivedHandoverCount ?? handoffs.length,
          receivedHandovers: handoffs.slice(0, 3).map((handoff) => ({
            ...handoff,
            status: statusById.get(handoff.id) ?? handoff.status,
          })),
        },
      };
    },

    async getNotifications(_storeId, signal) {
      assertNotAborted(signal);

      if (options.notificationFailure === true) {
        throw new HomeDataSourceError('NOTIFICATIONS_UNAVAILABLE', '알림을 불러오지 못했습니다.');
      }

      const unreadCount = options.unreadCount ?? 3;

      return {
        meta: SUCCESS_META,
        data: {
          items: [],
          unreadCount,
          badgeText: unreadCount >= 100 ? '99+' : String(unreadCount),
        },
      };
    },

    async confirmHandover(handoverId) {
      const handover = handoffs.find((item) => item.id === handoverId);

      if (handover === undefined || options.confirmFailureIds?.includes(handoverId) === true) {
        throw new HomeDataSourceError(
          'HANDOVER_CONFIRM_FAILED',
          '인수인계를 확인 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
        );
      }

      if (options.alreadyConfirmedOnConfirmIds?.includes(handoverId) === true) {
        statusById.set(handoverId, 'CONFIRMED');
        throw new HomeDataSourceError('HANDOVER_ALREADY_CONFIRMED', '이미 확인된 인수인계입니다.');
      }

      if (statusById.get(handoverId) !== 'UNCONFIRMED') {
        throw new HomeDataSourceError('HANDOVER_ALREADY_CONFIRMED', '이미 확인된 인수인계입니다.');
      }

      statusById.set(handoverId, 'CONFIRMED');

      return {
        meta: SUCCESS_META,
        data: {
          ...handover,
          body: `${handover.title} 내용을 확인해주세요.`,
          attachments: [],
          status: 'CONFIRMED',
          recipient: {
            ...handover.recipient,
            confirmedAt: new Date().toISOString(),
          },
        },
      };
    },
  };
}

export const mockHomeDataSource = createMockHomeDataSource();
