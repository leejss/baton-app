import type { ScheduleDataSource } from '@/test/fixtures/scheduleSource';
import type { ScheduleDto, ScheduleMemberDto } from '@/features/schedules/api/schedule.schema';
import { monthDates, monthLimits } from '@/features/schedules/lib/scheduleDate';
import { overlaps, scheduleFormSchema } from '@/features/schedules/lib/schedulePolicy';
import { AppError } from '@/shared/api/errors';
import { getTodayInSeoul, rangeDates } from '@/shared/lib/date';
import { hasStarted } from '@/shared/lib/time';
import { MOCK_STORE_MEMBERS } from '@/test/fixtures/members';

type MockOptions = {
  now?: () => Date;
  role?: 'MANAGER' | 'EMPLOYEE';
  userId?: number;
  schedules?: ScheduleDto[];
  failDatesOnce?: string[];
  failMonth?: boolean;
  failMembers?: boolean;
};

let sourceNumber = 0;

export function createMockScheduleDataSource(options: MockOptions = {}): ScheduleDataSource {
  const now = options.now ?? (() => new Date());
  const members: ScheduleMemberDto[] = MOCK_STORE_MEMBERS.map((member) => ({
    ...member,
  }));
  const role = options.role ?? 'MANAGER';
  const userId = options.userId ?? 1;
  const items = new Map((options.schedules ?? []).map((item) => [item.id, item]));
  const seededMonths = new Set<string>();
  const failures = new Set(options.failDatesOnce);
  let nextId = Math.max(0, ...items.keys()) + 1;

  function fail(errorCode: string, message: string, details?: unknown): never {
    const status =
      errorCode === 'FORBIDDEN'
        ? 403
        : errorCode === 'NOT_FOUND'
          ? 404
          : errorCode === 'VALIDATION_ERROR'
            ? 400
            : errorCode === 'SERVICE_UNAVAILABLE'
              ? 503
              : 409;
    throw new AppError('server', message, { errorCode, status, details });
  }
  function assertStore(storeId: number, signal?: AbortSignal) {
    if (signal?.aborted) throw new AppError('canceled', '요청이 취소됐습니다.');
    if (storeId !== 101) fail('FORBIDDEN', '이 매장의 근무표를 이용할 수 없습니다.');
  }
  function assertManager(storeId: number) {
    assertStore(storeId);
    if (role !== 'MANAGER') fail('FORBIDDEN', '관리자만 근무 일정을 변경할 수 있습니다.');
  }
  function seedMonth(month: string) {
    if (options.schedules !== undefined || seededMonths.has(month)) return;
    seededMonths.add(month);
    for (const date of monthDates(month)) {
      const day = Number(date.slice(8));
      if (day % 7 === 0) continue;
      for (const [index, employee] of members.entries()) {
        if (day % 3 === 0 && index === 0) continue;
        const startTime = ['08:00', '13:00', '17:00', '20:00'][index] ?? '20:00';
        const endTime = ['12:00', '17:00', '20:00', '24:00'][index] ?? '24:00';
        const id = nextId++;
        items.set(id, {
          id,
          employee,
          workDate: date,
          startTime,
          endTime,
          status: 'ACTIVE',
        });
      }
    }
  }
  function getItem(id: number) {
    const item = items.get(id);
    if (!item) fail('NOT_FOUND', '삭제되었거나 존재하지 않는 근무 일정입니다.');
    return item;
  }
  function assertFuture(date: string, time: string) {
    if (hasStarted(date, time, now()))
      fail('SCHEDULE_ALREADY_STARTED', '이미 시작된 근무 일정은 등록·수정·삭제할 수 없습니다.');
  }
  function getEmployee(id: number) {
    const member = members.find(
      (employee) => employee.userId === id && employee.status === 'ACTIVE',
    );
    if (!member)
      fail('VALIDATION_ERROR', '현재 선택할 수 없는 직원입니다. 다른 직원을 선택해주세요.');
    return member;
  }
  function duplicate(
    employeeId: number,
    date: string,
    startTime: string,
    endTime: string,
    exceptId?: number,
  ) {
    return [...items.values()].some(
      (item) =>
        item.id !== exceptId &&
        item.employee.userId === employeeId &&
        item.workDate === date &&
        overlaps(item, { startTime, endTime }),
    );
  }

  return {
    key: `mock-schedules-${++sourceNumber}`,
    async context() {
      return {
        storeId: 101,
        storeName: '카페 바톤 강남점',
        userId,
        canManage: role === 'MANAGER',
      };
    },
    async members(storeId, signal) {
      assertStore(storeId, signal);
      if (options.failMembers) fail('SERVICE_UNAVAILABLE', '직원 목록을 불러오지 못했습니다.');
      return members;
    },
    async month(storeId, month, signal) {
      assertStore(storeId, signal);
      const { min, max } = monthLimits(getTodayInSeoul(now()));
      if (month < min || month > max) fail('VALIDATION_ERROR', '조회 가능한 기간을 벗어났습니다.');
      if (options.failMonth) fail('SERVICE_UNAVAILABLE', '근무표를 불러오지 못했습니다.');
      seedMonth(month);
      const dates = monthDates(month);
      return {
        monthStart: dates[0],
        monthEnd: dates.at(-1),
        schedules: [...items.values()]
          .filter((item) => item.workDate.startsWith(month))
          .sort(
            (a, b) =>
              a.workDate.localeCompare(b.workDate) ||
              a.startTime.localeCompare(b.startTime) ||
              a.id - b.id,
          ),
      };
    },
    async detail(storeId, id, signal) {
      assertStore(storeId, signal);
      return getItem(id);
    },
    async create(storeId, input) {
      assertManager(storeId);
      const parsed = scheduleFormSchema.safeParse(input);
      if (!parsed.success)
        fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.');
      const employee = getEmployee(input.employeeId);
      const dates = rangeDates(input.startDate, input.endDate);
      for (const date of dates) {
        seedMonth(date.slice(0, 7));
      }
      const duplicates = dates.filter((date) =>
        duplicate(input.employeeId, date, input.startTime, input.endTime),
      );
      const details = {
        requestedCount: dates.length,
        duplicateCount: duplicates.length,
        registerableCount: dates.length - duplicates.length,
      };
      if (duplicates.length === dates.length)
        fail(
          'SCHEDULE_ALL_DUPLICATED',
          '선택한 모든 날짜에 기존 근무와 겹치는 일정이 있습니다. 날짜 또는 시간을 변경해주세요.',
        );
      if (duplicates.length && !input.acceptNonDuplicates)
        fail(
          'SCHEDULE_DUPLICATES_REQUIRE_CONFIRMATION',
          '중복되지 않은 날짜만 등록할지 확인해주세요.',
          details,
        );
      const results = dates.map((workDate) => {
        if (hasStarted(workDate, input.startTime, now()))
          return {
            workDate,
            status: 'FAILED' as const,
            errorCode: 'SCHEDULE_ALREADY_STARTED',
          };
        if (duplicates.includes(workDate)) return { workDate, status: 'DUPLICATE' as const };
        if (failures.delete(workDate))
          return {
            workDate,
            status: 'FAILED' as const,
            errorCode: 'SCHEDULE_CREATION_FAILED',
          };
        const id = nextId++;
        const schedule: ScheduleDto = {
          id,
          employee,
          workDate,
          startTime: input.startTime,
          endTime: input.endTime,
          status: 'ACTIVE',
        };
        items.set(id, schedule);
        return { workDate, status: 'CREATED' as const, schedule };
      });
      return {
        requestedCount: dates.length,
        createdCount: results.filter((result) => result.status === 'CREATED').length,
        duplicateCount: duplicates.length,
        failedCount: results.filter((result) => result.status === 'FAILED').length,
        results,
      };
    },
    async update(storeId, id, input) {
      assertManager(storeId);
      const existing = getItem(id);
      assertFuture(existing.workDate, existing.startTime);
      const parsed = scheduleFormSchema.safeParse({
        ...input,
        startDate: input.workDate,
        endDate: input.workDate,
      });
      if (!parsed.success)
        fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.');
      assertFuture(input.workDate, input.startTime);
      const employee = getEmployee(input.employeeId);
      seedMonth(input.workDate.slice(0, 7));
      if (duplicate(input.employeeId, input.workDate, input.startTime, input.endTime, id))
        fail('CONFLICT', '기존 근무 일정과 시간이 겹칩니다. 날짜 또는 시간을 변경해주세요.');
      const item: ScheduleDto = {
        id,
        employee,
        workDate: input.workDate,
        startTime: input.startTime,
        endTime: input.endTime,
        status: 'ACTIVE',
      };
      items.set(id, item);
      return item;
    },
    async remove(storeId, id) {
      assertManager(storeId);
      const item = getItem(id);
      assertFuture(item.workDate, item.startTime);
      items.delete(id);
    },
  };
}

export const mockScheduleDataSource = createMockScheduleDataSource();
