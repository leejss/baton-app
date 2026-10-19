import type { ScheduleDataSource } from '@/test/fixtures/scheduleSource';
import type { ScheduleDto } from '@/features/schedules/api/schedule.schema';
import { monthDates, monthLimits } from '@/features/schedules/lib/scheduleDate';
import { overlaps, scheduleFormSchema } from '@/features/schedules/lib/schedulePolicy';
import { AppError } from '@/shared/api/errors';
import { getTodayInSeoul } from '@/shared/lib/date';
import { hasStarted } from '@/shared/lib/time';
import { MOCK_STORE_MEMBERS } from '@/test/fixtures/members';
type MockOptions = {
  now?: () => Date;
  role?: 'ADMIN' | 'MEMBER';
  userId?: number;
  schedules?: ScheduleDto[];
  failMonth?: boolean;
};
let sourceNumber = 0;
export function createMockScheduleDataSource(options: MockOptions = {}): ScheduleDataSource {
  const now = options.now ?? (() => new Date());
  const userId = options.userId ?? 1;
  const items = new Map((options.schedules ?? []).map((item) => [item.id, item]));
  const seeded = new Set<string>();
  let nextId = Math.max(0, ...items.keys()) + 1;
  const fail = (code: string, message: string, status = 409): never => {
    throw new AppError('server', message, { errorCode: code, status });
  };
  const assertWorkspace = (workspaceId: number, signal?: AbortSignal) => {
    if (signal?.aborted) throw new AppError('canceled', '취소됐어요.');
    if (workspaceId !== 101) fail('FORBIDDEN', '공간에 참여해야 해요.', 403);
  };
  const getItem = (id: number) => {
    const item = items.get(id);
    if (!item) return fail('NOT_FOUND', '존재하지 않는 근무예요.', 404);
    return item;
  };
  const future = (date: string, time: string) => {
    if (hasStarted(date, time, now())) fail('SCHEDULE_ALREADY_STARTED', '이미 시작된 근무예요.');
  };
  function seed(month: string) {
    if (options.schedules !== undefined || seeded.has(month)) return;
    seeded.add(month);
    for (const date of monthDates(month))
      for (const [index, employee] of MOCK_STORE_MEMBERS.entries()) {
        const id = nextId++;
        items.set(id, {
          id,
          workspaceId: 101,
          employee,
          workDate: date,
          startTime: ['08:00', '13:00', '17:00', '20:00'][index] ?? '20:00',
          endTime: ['12:00', '17:00', '20:00', '24:00'][index] ?? '24:00',
          status: 'ACTIVE',
        });
      }
  }
  function validate(input: unknown) {
    const parsed = scheduleFormSchema.safeParse(input);
    if (!parsed.success) return fail('VALIDATION_ERROR', '입력값을 확인해주세요.', 400);
    future(parsed.data.workDate, parsed.data.startTime);
    return parsed.data;
  }
  function conflict(
    input: { workDate: string; startTime: string; endTime: string },
    except?: number,
  ) {
    if (
      [...items.values()].some(
        (item) =>
          item.id !== except &&
          item.employee.userId === userId &&
          item.workDate === input.workDate &&
          overlaps(item, input),
      )
    )
      fail('SCHEDULE_TIME_CONFLICT', '기존 근무와 시간이 겹쳐요.');
  }
  function owner(item: ScheduleDto) {
    if (item.employee.userId !== userId) fail('FORBIDDEN', '본인 근무만 변경할 수 있어요.', 403);
    future(item.workDate, item.startTime);
  }
  return {
    key: `mock-schedules-${++sourceNumber}`,
    role: options.role ?? 'MEMBER',
    async context() {
      return { workspaceId: 101, storeName: '카페 바톤', userId };
    },
    async month(workspaceId, month, signal) {
      assertWorkspace(workspaceId, signal);
      const { min, max } = monthLimits(getTodayInSeoul(now()));
      if (month < min || month > max) fail('VALIDATION_ERROR', '조회 기간을 벗어났어요.', 400);
      if (options.failMonth) fail('SERVICE_UNAVAILABLE', '근무표 조회 실패', 503);
      seed(month);
      const dates = monthDates(month);
      return {
        monthStart: dates[0],
        monthEnd: dates.at(-1),
        dailyScheduleCounts: dates.map((date) => ({
          date,
          scheduleCount: [...items.values()].filter((item) => item.workDate === date).length,
        })),
      };
    },
    async daily(workspaceId, date, cursor, signal) {
      assertWorkspace(workspaceId, signal);
      seed(date.slice(0, 7));
      const all = [...items.values()]
        .filter((item) => item.workDate === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id - b.id);
      const offset = cursor ? all.findIndex((item) => String(item.id) === cursor) + 1 : 0;
      const page = all.slice(offset, offset + 3);
      const hasNext = offset + page.length < all.length;
      return {
        date,
        totalEmployeeCount: new Set(all.map((item) => item.employee.userId)).size,
        items: page,
        nextCursor: hasNext ? String(page.at(-1)?.id) : null,
        hasNext,
      };
    },
    async detail(workspaceId, id, signal) {
      assertWorkspace(workspaceId, signal);
      return getItem(id);
    },
    async create(workspaceId, input) {
      assertWorkspace(workspaceId);
      const parsed = validate(input);
      seed(parsed.workDate.slice(0, 7));
      conflict(parsed);
      const employee = MOCK_STORE_MEMBERS.find((member) => member.userId === userId)!;
      const id = nextId++;
      const item: ScheduleDto = { id, workspaceId, employee, ...parsed, status: 'ACTIVE' };
      items.set(id, item);
      return item;
    },
    async update(workspaceId, id, input) {
      assertWorkspace(workspaceId);
      const item = getItem(id);
      owner(item);
      const parsed = validate(input);
      conflict(parsed, id);
      const updated = { ...item, ...parsed };
      items.set(id, updated);
      return updated;
    },
    async remove(workspaceId, id) {
      assertWorkspace(workspaceId);
      owner(getItem(id));
      items.delete(id);
    },
  };
}
