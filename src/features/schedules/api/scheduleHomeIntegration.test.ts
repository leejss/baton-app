import { expect, it } from "@jest/globals";
import { createTestClient } from "@/test/MainTestProvider";
import { invalidateScheduleViews } from "@/features/schedules/api/schedule.mutations";
it("일정 변경은 해당 매장 홈과 추천만 갱신하고 다른 매장 캐시는 보존한다", async () => {
  const client = createTestClient();
  for (const key of [
    ["home", 101],
    ["home", 202],
    ["handoffs", 101, "recipients"],
    ["schedules", 101],
  ])
    client.setQueryData(key, []);
  await invalidateScheduleViews(client, 101);
  expect(client.getQueryState(["home", 101])?.isInvalidated).toBe(true);
  expect(
    client.getQueryState(["handoffs", 101, "recipients"])?.isInvalidated,
  ).toBe(true);
  expect(client.getQueryState(["home", 202])?.isInvalidated).toBe(false);
  client.clear();
});
