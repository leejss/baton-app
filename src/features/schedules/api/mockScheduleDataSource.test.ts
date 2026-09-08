import { describe, expect, it, jest } from '@jest/globals';

import { createMockScheduleDataSource } from '@/features/schedules/api/mockScheduleDataSource';
import { getDuplicateCounts, saveScheduleDates } from '@/features/schedules/api/schedule.mutations';
import {
  monthlyScheduleSchema,
  scheduleSchema,
  type ScheduleDto,
} from '@/features/schedules/api/schedule.schema';
import { MOCK_STORE_MEMBERS } from '@/shared/api/mockMembers';

const now = () => new Date('2026-09-07T00:00:00Z');
const initial: ScheduleDto = {
  id: 100,
  employee: MOCK_STORE_MEMBERS[1],
  workDate: '2026-09-08',
  startTime: '09:00',
  endTime: '12:00',
  status: 'ACTIVE',
};
const input = {
  employeeId: 2,
  startDate: '2026-09-08',
  endDate: '2026-09-10',
  startTime: '09:00',
  endTime: '12:00',
};

describe('근무표 mock 저장 계약', () => {
  it('사용자 동의 전에는 일부 중복 요청을 저장하지 않으며 건수를 보존한다', async () => {
    const source = createMockScheduleDataSource({ now, schedules: [initial] });
    let error: unknown;
    try {
      await saveScheduleDates(source, 101, input, false);
    } catch (caught) {
      error = caught;
    }
    expect(getDuplicateCounts(error)).toEqual({
      requestedCount: 3,
      duplicateCount: 1,
      registerableCount: 2,
    });
    expect(monthlyScheduleSchema.parse(await source.month(101, '2026-09')).schedules).toHaveLength(
      1,
    );
    expect(await saveScheduleDates(source, 101, input, true)).toEqual({
      created: ['2026-09-09', '2026-09-10'],
      duplicates: ['2026-09-08'],
      failed: [],
    });
  });
  it('전부 중복이면 동의 여부와 관계없이 저장하지 않는다', async () => {
    const source = createMockScheduleDataSource({ now, schedules: [initial] });
    await expect(
      saveScheduleDates(source, 101, { ...input, endDate: input.startDate }, true),
    ).rejects.toMatchObject({ errorCode: 'SCHEDULE_ALL_DUPLICATED' });
  });
  it('부분 실패 후 실패 날짜만 재전송하며 먼저 성공한 일정은 유지한다', async () => {
    const source = createMockScheduleDataSource({
      now,
      schedules: [],
      failDatesOnce: ['2026-09-08', '2026-09-10'],
    });
    const first = await saveScheduleDates(source, 101, input, false);
    expect(first).toEqual({
      created: ['2026-09-09'],
      duplicates: [],
      failed: ['2026-09-08', '2026-09-10'],
    });
    const create = jest.spyOn(source, 'create');
    expect(await saveScheduleDates(source, 101, input, true, first.failed)).toEqual({
      created: ['2026-09-08', '2026-09-10'],
      duplicates: [],
      failed: [],
    });
    expect(create.mock.calls.map(([, request]) => [request.startDate, request.endDate])).toEqual([
      ['2026-09-08', '2026-09-08'],
      ['2026-09-10', '2026-09-10'],
    ]);
    expect(monthlyScheduleSchema.parse(await source.month(101, '2026-09')).schedules).toHaveLength(
      3,
    );
  });
  it('수정 중인 자기 일정은 중복에서 제외하고 수정·삭제 결과를 월간 응답에 반영한다', async () => {
    const source = createMockScheduleDataSource({ now, schedules: [initial] });
    const updated = scheduleSchema.parse(
      await source.update(101, 100, {
        employeeId: 2,
        workDate: '2026-09-09',
        startTime: '09:00',
        endTime: '24:00',
      }),
    );
    expect(updated.workDate).toBe('2026-09-09');
    expect(
      monthlyScheduleSchema.parse(await source.month(101, '2026-09')).schedules[0]?.workDate,
    ).toBe('2026-09-09');
    await source.remove(101, 100);
    expect(monthlyScheduleSchema.parse(await source.month(101, '2026-09')).schedules).toHaveLength(
      0,
    );
    await expect(source.detail(101, 100)).rejects.toMatchObject({ errorCode: 'NOT_FOUND' });
  });
  it('직원의 직접 쓰기 요청과 이미 시작한 일정의 변경을 차단한다', async () => {
    const employee = createMockScheduleDataSource({ now, role: 'EMPLOYEE', schedules: [initial] });
    await expect(employee.remove(101, 100)).rejects.toMatchObject({ errorCode: 'FORBIDDEN' });
    await expect(saveScheduleDates(employee, 101, input, false)).rejects.toMatchObject({
      errorCode: 'FORBIDDEN',
    });
    const started = createMockScheduleDataSource({
      now: () => new Date('2026-09-08T00:00:00Z'),
      schedules: [initial],
    });
    await expect(started.remove(101, 100)).rejects.toMatchObject({
      errorCode: 'SCHEDULE_ALREADY_STARTED',
    });
    await expect(
      started.update(101, 100, {
        employeeId: 2,
        workDate: '2026-09-09',
        startTime: '09:00',
        endTime: '12:00',
      }),
    ).rejects.toMatchObject({ errorCode: 'SCHEDULE_ALREADY_STARTED' });
  });
});
