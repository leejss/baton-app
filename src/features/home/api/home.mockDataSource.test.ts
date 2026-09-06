import { describe, expect, it } from '@jest/globals';

import { createMockHomeDataSource } from '@/features/home/api/home.mockDataSource';
import {
  handoverResponseSchema,
  homeSummaryResponseSchema,
  notificationListResponseSchema,
  userProfileResponseSchema,
} from '@/features/home/api/home.schema';

describe('mock home data source', () => {
  it('OpenAPI 응답 구조를 반환하고 확인 상태를 메모리에 유지한다', async () => {
    const source = createMockHomeDataSource();

    expect(userProfileResponseSchema.parse(await source.getMyProfile()).meta.result).toBe(
      'SUCCESS',
    );

    const before = homeSummaryResponseSchema.parse(await source.getHome(101, '2026-09-06'));
    const targetId = before.data.receivedHandovers[1]!.id;
    const confirmed = handoverResponseSchema.parse(await source.confirmHandover(targetId));
    const after = homeSummaryResponseSchema.parse(await source.getHome(101, '2026-09-06'));

    expect(confirmed.data.status).toBe('CONFIRMED');
    expect(after.data.receivedHandoverCount).toBe(before.data.receivedHandoverCount);
    expect(after.data.receivedHandovers.map(({ id }) => id)).toEqual(
      before.data.receivedHandovers.map(({ id }) => id),
    );
    expect(after.data.receivedHandovers[1]?.status).toBe('CONFIRMED');
  });

  it('선택 날짜 일정과 99+ badge를 동적으로 만든다', async () => {
    const source = createMockHomeDataSource({ unreadCount: 120 });
    const summary = homeSummaryResponseSchema.parse(await source.getHome(101, '2027-01-02'));
    const notifications = notificationListResponseSchema.parse(await source.getNotifications(101));

    expect(summary.data.schedulePreview.every(({ workDate }) => workDate === '2027-01-02')).toBe(
      true,
    );
    expect(notifications.data).toMatchObject({ unreadCount: 120, badgeText: '99+' });
  });

  it('OpenAPI 제한을 벗어난 fixture를 schema에서 거부한다', async () => {
    const source = createMockHomeDataSource({
      scheduleFactory: (date) =>
        Array.from({ length: 4 }, (_, index) => ({
          id: index + 1,
          employee: {
            userId: index + 10,
            email: `user${index}@baton.app`,
            displayName: `직원${index}`,
            profileImage: { source: 'STATIC', key: 'DEFAULT_EMPLOYEE' },
            role: 'EMPLOYEE',
            status: 'ACTIVE',
          },
          workDate: date,
          startTime: '17:00',
          endTime: '22:00',
          status: 'ACTIVE',
        })),
    });

    const invalidResponse = await source.getHome(101, '2026-09-06');

    expect(() => homeSummaryResponseSchema.parse(invalidResponse)).toThrow();
    expect(() =>
      homeSummaryResponseSchema.parse({
        meta: { result: 'SUCCESS', errorCode: null, message: null },
        data: {
          date: '2026-09-06',
          schedulePreview: [],
          receivedHandoverCount: -1,
          receivedHandovers: [],
        },
      }),
    ).toThrow();
  });
});
