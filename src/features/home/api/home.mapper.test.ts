import { describe, expect, it } from '@jest/globals';

import { mapHomeHandoffSectionModel, mapHomeScheduleModel } from '@/features/home/api/mappers';
import { homeSummarySchema } from '@/features/home/api/home.schema';

const meta = { result: 'SUCCESS', errorCode: null, message: null } as const;

function member(userId: number, status: 'ACTIVE' | 'LEFT' = 'ACTIVE') {
  return {
    userId,
    email: `user${userId}@baton.app`,
    displayName: `직원${userId}`,
    profileImage: {
      source: 'STATIC' as const,
      key: 'DEFAULT_EMPLOYEE' as const,
    },
    role: 'EMPLOYEE' as const,
    status,
  };
}

describe('home mapper', () => {
  it('DTO를 화면 모델로 바꾸며 서버 순서와 노출 제한을 보존한다', () => {
    const summary = homeSummarySchema.parse(
      {
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
      }.data,
    );
    const handoffs = mapHomeHandoffSectionModel(summary);
    const schedule = mapHomeScheduleModel(1, summary);

    expect(handoffs.items.map(({ id }) => id)).toEqual([33, 22, 11]);
    expect(handoffs.items.map(({ canConfirm }) => canConfirm)).toEqual([false, false, true]);
    expect(schedule.items.map(({ userId }) => userId)).toEqual([3, 1, 2]);
    expect(schedule.items.map(({ canCreateHandoff }) => canCreateHandoff)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('관리자와 직원의 서버 프로필 키를 화면 모델에 보존한다', () => {
    const summary = homeSummarySchema.parse({
      date: '2026-09-06',
      receivedHandoverCount: 0,
      receivedHandovers: [],
      schedulePreview: ['DEFAULT_MANAGER', 'DEFAULT_EMPLOYEE'].map((key, index) => ({
        id: index + 1,
        employee: { ...member(index + 1), profileImage: { source: 'STATIC', key } },
        workDate: '2026-09-06',
        startTime: '09:00',
        endTime: '18:00',
        status: 'ACTIVE',
      })),
    });

    expect(mapHomeScheduleModel(1, summary).items.map((item) => item.profileImageKey)).toEqual([
      'DEFAULT_MANAGER',
      'DEFAULT_EMPLOYEE',
    ]);
  });
});
