import { describe, expect, it } from '@jest/globals';

import { mapHomeScreenModel } from '@/features/home/api/home.mapper';
import {
  homeSummaryResponseSchema,
  myStoreResponseSchema,
  notificationListResponseSchema,
  userProfileResponseSchema,
} from '@/features/home/api/home.schema';
import { getHomeProfileImageSource } from '@/features/home/lib/homeAssets';

const meta = { result: 'SUCCESS', errorCode: null, message: null } as const;

const profile = userProfileResponseSchema.parse({
  meta,
  data: {
    id: 1,
    email: 'manager@baton.app',
    displayName: '김지원',
    profileImage: { source: 'STATIC', key: 'DEFAULT_MANAGER' },
    status: 'ACTIVE',
  },
}).data;

const store = myStoreResponseSchema.parse({
  meta,
  data: {
    membership: {
      store: {
        id: 101,
        storeName: '아주 긴 카페 바톤 매장 이름',
        branchName: '강남점',
        address: '서울시 강남구',
        storeContact: '02-1234-5678',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      },
      role: 'MANAGER',
      status: 'ACTIVE',
    },
  },
}).data.membership!;

function member(userId: number, status: 'ACTIVE' | 'LEFT' = 'ACTIVE') {
  return {
    userId,
    email: `user${userId}@baton.app`,
    displayName: `직원${userId}`,
    profileImage: { source: 'STATIC' as const, key: 'DEFAULT_EMPLOYEE' as const },
    role: 'EMPLOYEE' as const,
    status,
  };
}

describe('home mapper', () => {
  it('DTO를 화면 모델로 바꾸며 서버 순서와 노출 제한을 보존한다', () => {
    const summary = homeSummaryResponseSchema.parse({
      meta,
      data: {
        date: '2026-09-06',
        schedulePreview: [
          {
            id: 3,
            employee: member(3),
            workDate: '2026-09-06',
            startTime: '19:00',
            endTime: '23:00',
            status: 'ACTIVE',
          },
          {
            id: 1,
            employee: member(1),
            workDate: '2026-09-06',
            startTime: '09:00',
            endTime: '18:00',
            status: 'ACTIVE',
          },
          {
            id: 2,
            employee: member(2, 'LEFT'),
            workDate: '2026-09-06',
            startTime: '18:00',
            endTime: '22:00',
            status: 'ACTIVE',
          },
        ],
        receivedHandoverCount: 7,
        receivedHandovers: [
          {
            id: 33,
            type: 'OTHER',
            title: '세 번째',
            sender: member(3),
            recipient: { user: member(1), status: 'ACTIVE' },
            status: 'TERMINATED',
            sentAt: '2026-09-06T03:00:00Z',
          },
          {
            id: 22,
            type: 'WORK_TASK',
            title: '두 번째',
            sender: member(2),
            recipient: { user: member(1), status: 'ACTIVE' },
            status: 'CONFIRMED',
            sentAt: '2026-09-06T02:00:00Z',
          },
          {
            id: 11,
            type: 'STORE_STATUS',
            title: '첫 번째',
            sender: member(3),
            recipient: { user: member(1), status: 'ACTIVE' },
            status: 'UNCONFIRMED',
            sentAt: '2026-09-06T01:00:00Z',
          },
        ],
      },
    }).data;
    const notifications = notificationListResponseSchema.parse({
      meta,
      data: { items: [], unreadCount: 100, badgeText: '99+' },
    }).data;

    const model = mapHomeScreenModel({ profile, membership: store }, summary, notifications);

    expect(model.header).toEqual({
      displayName: '김지원',
      storeLabel: '아주 긴 카페 바톤 매장 이름 강남점',
      roleLabel: '관리자',
      badgeText: '99+',
    });
    expect(model.handoffs.items.map(({ id }) => id)).toEqual([33, 22, 11]);
    expect(model.handoffs.items.map(({ canConfirm }) => canConfirm)).toEqual([false, false, true]);
    expect(model.schedule.items.map(({ userId }) => userId)).toEqual([3, 1, 2]);
    expect(model.schedule.items.map(({ canCreateHandoff }) => canCreateHandoff)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('알림이 0건이면 badge를 숨긴다', () => {
    const summary = homeSummaryResponseSchema.parse({
      meta,
      data: {
        date: '2026-09-06',
        schedulePreview: [],
        receivedHandoverCount: 0,
        receivedHandovers: [],
      },
    }).data;
    const notifications = notificationListResponseSchema.parse({
      meta,
      data: { items: [], unreadCount: 0, badgeText: '0' },
    }).data;

    expect(
      mapHomeScreenModel({ profile, membership: store }, summary, notifications).header.badgeText,
    ).toBeUndefined();
  });

  it('세 프로필 키를 같은 임시 Figma asset에 매핑한다', () => {
    expect(getHomeProfileImageSource('DEFAULT_01')).toBe(
      getHomeProfileImageSource('DEFAULT_MANAGER'),
    );
    expect(getHomeProfileImageSource('DEFAULT_MANAGER')).toBe(
      getHomeProfileImageSource('DEFAULT_EMPLOYEE'),
    );
  });
});
