import { afterEach, expect, it, jest } from '@jest/globals';

import { fetchDailySchedules, fetchMonth } from '@/features/schedules/api/schedule.api';
import { MOCK_STORE_MEMBERS } from '@/test/fixtures/members';
import { monthDates } from '@/features/schedules/lib/scheduleDate';

jest.mock('@/shared/config/api', () => ({
  API_URL: 'https://api.example.com/api/v1',
  assertApiConfigured: jest.fn(),
}));

afterEach(() => {
  jest.restoreAllMocks();
});

function response(data: unknown) {
  return new Response(
    JSON.stringify({
      meta: { result: 'SUCCESS', errorCode: null, message: null },
      data,
    }),
  );
}

it('상세 일정이 없는 최신 월간 응답을 공통 클라이언트에서 파싱한다', async () => {
  const data = {
    monthStart: '2026-09-01',
    monthEnd: '2026-09-30',
    dailyScheduleCounts: monthDates('2026-09').map((date) => ({
      date,
      scheduleCount: date === '2026-09-15' ? 7 : 0,
    })),
  };
  const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(response(data));
  await expect(fetchMonth(101, '2026-09')).resolves.toEqual(data);
  expect(String(fetch.mock.calls[0]?.[0])).toBe(
    'https://api.example.com/api/v1/stores/101/schedules?month=2026-09',
  );
});

it.each([undefined, null])(
  '마지막 페이지 커서가 %s여도 날짜별 응답을 읽는다',
  async (nextCursor) => {
    const data = {
      date: '2026-09-15',
      totalEmployeeCount: 1,
      items: [
        {
          id: 12,
          employee: MOCK_STORE_MEMBERS[0],
          workDate: '2026-09-15',
          startTime: '18:00',
          endTime: '24:00',
          status: 'ACTIVE',
        },
      ],
      nextCursor,
      hasNext: false,
    };
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(response(data));
    await expect(fetchDailySchedules(101, '2026-09-15')).resolves.toEqual(data);
    const url = new URL(String(fetch.mock.calls[0]?.[0]));
    expect(url.pathname).toBe('/api/v1/stores/101/daily-schedules');
    expect(url.searchParams.get('date')).toBe('2026-09-15');
    expect(url.searchParams.get('size')).toBe('3');
    expect(url.searchParams.has('cursor')).toBe(false);
  },
);

it('불투명 커서를 URL 인코딩해 그대로 전달한다', async () => {
  const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
    response({
      date: '2026-09-15',
      totalEmployeeCount: 0,
      items: [],
      nextCursor: null,
      hasNext: false,
    }),
  );
  await fetchDailySchedules(101, '2026-09-15', 'opaque+/cursor==');
  const url = new URL(String(fetch.mock.calls[0]?.[0]));
  expect(url.searchParams.get('cursor')).toBe('opaque+/cursor==');
});
