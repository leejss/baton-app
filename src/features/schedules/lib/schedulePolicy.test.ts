import { expect, it } from '@jest/globals';
import type { ScheduleItem } from '@/features/schedules/types';
import {
  canEditSchedule,
  overlaps,
  scheduleFormSchema,
} from '@/features/schedules/lib/schedulePolicy';
const item: ScheduleItem = {
  id: 1,
  workspaceId: 101,
  member: {
    id: 1,
    name: '테스트',
    email: null,
    profileImage: { source: 'STATIC', key: 'DEFAULT_01' },
    role: 'MEMBER',
    isActive: true,
  },
  date: '2026-10-21',
  startTime: '09:00',
  endTime: '12:00',
};
it('일반 멤버도 본인의 시작 전 일정은 편집한다', () => {
  expect(canEditSchedule(item, 1, new Date('2026-10-20'))).toBe(true);
  expect(canEditSchedule(item, 2, new Date('2026-10-20'))).toBe(false);
  expect(canEditSchedule(item, 1, new Date('2026-10-21T00:00:00Z'))).toBe(false);
});
it('관리자라는 이유로 다른 사람의 일정을 바꾸지 않는다', () =>
  expect(
    canEditSchedule(
      { ...item, member: { ...item.member, role: 'ADMIN' } },
      2,
      new Date('2026-10-20'),
    ),
  ).toBe(false));
it('날짜는 하나이며 올바른 시간과 24:00 종료를 받는다', () => {
  const input = { workDate: '2026-10-21', startTime: '22:00', endTime: '24:00' };
  expect(scheduleFormSchema.parse(input)).toEqual(input);
  for (const change of [
    { workDate: '2026-02-30' },
    { startTime: '24:00' },
    { endTime: '22:00' },
    { endTime: '24:01' },
  ])
    expect(scheduleFormSchema.safeParse({ ...input, ...change }).success).toBe(false);
});
it('인접 시간은 허용하고 겹치는 시간은 구분한다', () => {
  expect(overlaps(item, { startTime: '12:00', endTime: '13:00' })).toBe(false);
  expect(overlaps(item, { startTime: '11:59', endTime: '13:00' })).toBe(true);
});
