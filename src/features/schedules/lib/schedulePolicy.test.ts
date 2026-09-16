import { describe, expect, it } from '@jest/globals';

import type { ScheduleItem } from '@/features/schedules/types';
import {
  canEditSchedule,
  overlaps,
  scheduleFormSchema,
} from '@/features/schedules/lib/schedulePolicy';

function shift(id: number, memberId: number, startTime: string, endTime: string): ScheduleItem {
  return {
    id,
    member: {
      id: memberId,
      name: '직원',
      email: 'test@baton.app',
      role: 'EMPLOYEE',
      isActive: true,
    },
    date: '2026-09-08',
    startTime,
    endTime,
  };
}

describe('근무표 노출·입력 정책', () => {
  const earlyOwn = shift(1, 1, '08:00', '10:00');
  it('인접 일정은 허용하고 일부 겹치는 일정은 차단한다', () => {
    expect(overlaps(earlyOwn, { startTime: '10:00', endTime: '11:00' })).toBe(false);
    expect(overlaps(earlyOwn, { startTime: '09:59', endTime: '11:00' })).toBe(true);
  });
  it('관리자 권한과 일정 시작 시각을 모두 검사한다', () => {
    expect(canEditSchedule(earlyOwn, false, new Date('2026-09-01'))).toBe(false);
    expect(canEditSchedule(earlyOwn, true, new Date('2026-09-07T23:00:00Z'))).toBe(false);
    expect(canEditSchedule(earlyOwn, true, new Date('2026-09-01'))).toBe(true);
  });
  it('같은 날 종료 24:00만 허용하고 잘못된 시간 및 역전된 구간은 거부한다', () => {
    const input = {
      employeeId: 1,
      startDate: '2026-09-08',
      endDate: '2026-09-08',
      startTime: '22:00',
      endTime: '24:00',
    };
    expect(scheduleFormSchema.safeParse(input).success).toBe(true);
    for (const change of [
      { startTime: '24:00' },
      { endTime: '24:01' },
      { endTime: '22:00' },
      { endTime: '00:00' },
      { startTime: '9:00' },
      { endDate: '2026-09-07' },
      { startDate: '2026-02-30' },
    ])
      expect(scheduleFormSchema.safeParse({ ...input, ...change }).success).toBe(false);
  });
});
