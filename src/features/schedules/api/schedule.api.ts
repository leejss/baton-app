import { get, post, patch, del } from "@/shared/api/client";
import {
  monthlyScheduleSchema,
  scheduleSchema,
  scheduleBatchSchema,
  type ScheduleCreateRequest,
  type ScheduleUpdateRequest,
} from "@/features/schedules/api/schedule.schema";
export const fetchMonth = (
  storeId: number,
  month: string,
  signal?: AbortSignal,
) =>
  get(
    `/stores/${storeId}/schedules?${new URLSearchParams({ month })}`,
    monthlyScheduleSchema,
    { signal },
  );
export const fetchSchedule = (
  storeId: number,
  id: number,
  signal?: AbortSignal,
) => get(`/stores/${storeId}/schedules/${id}`, scheduleSchema, { signal });
export const createSchedules = (
  storeId: number,
  input: ScheduleCreateRequest,
) => post(`/stores/${storeId}/schedules`, input, scheduleBatchSchema);
export const updateSchedule = (
  storeId: number,
  id: number,
  input: ScheduleUpdateRequest,
) => patch(`/stores/${storeId}/schedules/${id}`, input, scheduleSchema);
export const removeSchedule = (storeId: number, id: number) =>
  del(`/stores/${storeId}/schedules/${id}`);
