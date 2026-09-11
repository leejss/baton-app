import { expect, it } from "@jest/globals";
import { toSaveResult } from "@/features/schedules/api/mappers";
import { scheduleBatchSchema } from "@/features/schedules/api/schedule.schema";
import { getDuplicateCounts } from "@/features/schedules/api/schedule.mutations";
import { AppError } from "@/shared/api/errors";
it("부분 저장 실패의 원인을 보존하고 생성 실패만 재시도 대상으로 만든다", () => {
  const result = toSaveResult(
    scheduleBatchSchema.parse({
      requestedCount: 3,
      createdCount: 1,
      failedCount: 2,
      duplicateCount: 0,
      results: [
        { workDate: "2026-09-11", status: "CREATED", schedule: null },
        {
          workDate: "2026-09-12",
          status: "FAILED",
          errorCode: "SCHEDULE_CREATION_FAILED",
        },
        {
          workDate: "2026-09-13",
          status: "FAILED",
          errorCode: "SCHEDULE_ALREADY_STARTED",
        },
      ],
    }),
  );
  expect(result.created).toEqual(["2026-09-11"]);
  expect(
    result.failures.filter((item) => item.retryable).map((item) => item.date),
  ).toEqual(["2026-09-12"]);
  expect(result.failures[1].errorCode).toBe("SCHEDULE_ALREADY_STARTED");
});
it("중복 확인 응답의 data를 검증하여 확인창에 전달한다", () => {
  expect(
    getDuplicateCounts(
      new AppError("server", "중복", {
        status: 409,
        errorCode: "SCHEDULE_DUPLICATES_REQUIRE_CONFIRMATION",
        details: { requestedCount: 3, duplicateCount: 1, registerableCount: 2 },
      }),
    ),
  ).toEqual({ requestedCount: 3, duplicateCount: 1, registerableCount: 2 });
});
