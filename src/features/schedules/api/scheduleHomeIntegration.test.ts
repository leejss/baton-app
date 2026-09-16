import { expect, it } from '@jest/globals';
import { createTestClient } from '@/test/MainTestProvider';
import { invalidateScheduleViews } from '@/features/schedules/api/schedule.mutations';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
it('일정 변경은 해당 매장의 월간·날짜별·홈·추천을 갱신하고 다른 매장 캐시는 보존한다', async () => {
  const client = createTestClient();
  for (const key of [
    ['home', 101],
    ['home', 202],
    ['handoffs', 101, 'recipients'],
    ['schedules', 101],
    scheduleQueries.month(101, '2026-09').queryKey,
    scheduleQueries.daily(101, '2026-09-15').queryKey,
    scheduleQueries.daily(101, '2026-09-16').queryKey,
    scheduleQueries.daily(202, '2026-09-15').queryKey,
  ])
    client.setQueryData(key, []);
  await invalidateScheduleViews(client, 101);
  expect(client.getQueryState(['home', 101])?.isInvalidated).toBe(true);
  expect(client.getQueryState(['handoffs', 101, 'recipients'])?.isInvalidated).toBe(true);
  expect(client.getQueryState(['home', 202])?.isInvalidated).toBe(false);
  expect(client.getQueryState(scheduleQueries.month(101, '2026-09').queryKey)?.isInvalidated).toBe(
    true,
  );
  expect(
    client.getQueryState(scheduleQueries.daily(101, '2026-09-15').queryKey)?.isInvalidated,
  ).toBe(true);
  expect(
    client.getQueryState(scheduleQueries.daily(101, '2026-09-16').queryKey)?.isInvalidated,
  ).toBe(true);
  expect(
    client.getQueryState(scheduleQueries.daily(202, '2026-09-15').queryKey)?.isInvalidated,
  ).toBe(false);
  client.clear();
});
