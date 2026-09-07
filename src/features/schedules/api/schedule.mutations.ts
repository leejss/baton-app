import type { QueryClient } from '@tanstack/react-query';
import { homeQueries } from '@/features/home/api/home.queries';

import type { ScheduleDataSource } from '@/features/schedules/api/schedule.dataSource';
import { toSaveResult } from '@/features/schedules/api/schedule.mappers';
import {
  duplicateCountsSchema,
  scheduleBatchSchema,
} from '@/features/schedules/api/schedule.schema';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { contiguousRanges, rangeDates } from '@/features/schedules/lib/scheduleDate';
import type { ScheduleFormValues, ScheduleSaveResult } from '@/features/schedules/model/schedule';
import { scheduleFormSchema } from '@/features/schedules/model/schedulePolicy';
import { isAppError } from '@/shared/api/errors';

export function getDuplicateCounts(error: unknown) {
  if (!isAppError(error) || error.errorCode !== 'SCHEDULE_DUPLICATES_REQUIRE_CONFIRMATION')
    return undefined;
  const result = duplicateCountsSchema.safeParse(error.details);
  return result.success ? result.data : undefined;
}

export async function saveScheduleDates(
  source: ScheduleDataSource,
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
  };
  const ranges = contiguousRanges(dates);
  for (const range of ranges) {
    try {
      const response = scheduleBatchSchema.parse(
        await source.create(storeId, {
          ...input,
          startDate: range.start,
          endDate: range.end,
          acceptNonDuplicates,
        }),
      );
      const saved = toSaveResult(response);
      result.created.push(...saved.created);
      result.duplicates.push(...saved.duplicates);
      result.failed.push(...saved.failed);
    } catch (error) {
      // 최초 요청의 중복·권한·입력 오류는 그대로 안내한다. 재시도에서는 앞 구간 성공을 보존한다.
      if (!retryDates) throw error;
      result.failed.push(...rangeDates(range.start, range.end));
    }
  }
  return result;
}

export async function invalidateScheduleViews(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: scheduleQueries.all() }),
    client.invalidateQueries({ queryKey: homeQueries.all() }),
  ]);
}
