import { handoffQueries } from "@/features/handoffs/api/handoff.queries";
import { notificationQueries } from "@/features/notifications/api/notification.queries";
import { storeQueries } from "@/features/stores/api/store.queries";
import { logger } from "@/shared/lib/logger";
import { logApiFailure } from "@/shared/api/queryClient";
import { createSchedules } from "@/features/schedules/api/schedule.api";
import type { QueryClient } from "@tanstack/react-query";
import { homeQueries } from "@/features/home/api/home.queries";

import { toSaveResult } from "@/features/schedules/api/mappers";
import { duplicateCountsSchema } from "@/features/schedules/api/schedule.schema";
import { scheduleQueries } from "@/features/schedules/api/schedule.queries";
import {
  contiguousRanges,
  rangeDates,
} from "@/features/schedules/lib/scheduleDate";
import type {
  ScheduleFormValues,
  ScheduleSaveResult,
} from "@/features/schedules/types";
import { scheduleFormSchema } from "@/features/schedules/lib/schedulePolicy";
import { isAppError } from "@/shared/api/errors";

export function getDuplicateCounts(error: unknown) {
  if (
    !isAppError(error) ||
    error.errorCode !== "SCHEDULE_DUPLICATES_REQUIRE_CONFIRMATION"
  )
    return undefined;
  const result = duplicateCountsSchema.safeParse(error.details);
  return result.success ? result.data : undefined;
}

export async function saveScheduleDates(
  storeId: number,
  form: ScheduleFormValues,
  acceptNonDuplicates: boolean,
  retryDates?: string[],
): Promise<ScheduleSaveResult> {
  const input = scheduleFormSchema.parse(form);
  const dates = retryDates ?? rangeDates(input.startDate, input.endDate);
  const result: ScheduleSaveResult = {
    created: [],
    duplicates: [],
    failed: [],
    failures: [],
  };
  const ranges = contiguousRanges(dates);
  for (const range of ranges) {
    try {
      const response = await createSchedules(storeId, {
        ...input,
        startDate: range.start,
        endDate: range.end,
        acceptNonDuplicates,
      });
      const saved = toSaveResult(response);
      result.created.push(...saved.created);
      result.duplicates.push(...saved.duplicates);
      result.failed.push(...saved.failed);
      result.failures.push(...saved.failures);
      for (const failure of saved.failures)
        logger.warn("날짜별 근무 저장 실패", {
          operation: "schedules.create",
          errorCode: failure.errorCode,
          date: failure.date,
          retryable: failure.retryable,
        });
    } catch (error) {
      // 최초 요청의 중복·권한·입력 오류는 그대로 안내한다. 재시도에서는 앞 구간 성공을 보존한다.
      if (!retryDates) throw error;
      const failedDates = rangeDates(range.start, range.end);
      result.failed.push(...failedDates);
      result.failures.push(
        ...failedDates.map((date) => ({
          date,
          errorCode: isAppError(error)
            ? (error.errorCode ?? error.code)
            : "UNKNOWN",
          retryable:
            isAppError(error) &&
            (error.code === "network" ||
              error.code === "timeout" ||
              (error.status ?? 0) >= 500),
        })),
      );
      logApiFailure(error, "schedules.retry");
    }
  }
  return result;
}

export async function invalidateScheduleViews(
  client: QueryClient,
  storeId: number,
) {
  await Promise.all([
    client.invalidateQueries({ queryKey: scheduleQueries.store(storeId) }),
    client.invalidateQueries({ queryKey: homeQueries.store(storeId) }),
    client.invalidateQueries({
      queryKey: handoffQueries.recipientsKey(storeId),
    }),
    client.invalidateQueries({ queryKey: notificationQueries.store(storeId) }),
  ]);
}

export async function refreshScheduleConflict(
  client: QueryClient,
  storeId: number,
  error: unknown,
) {
  if (isAppError(error) && [400, 403, 404, 409].includes(error.status ?? 0))
    await Promise.all([
      invalidateScheduleViews(client, storeId),
      client.invalidateQueries({ queryKey: storeQueries.all() }),
    ]);
}
