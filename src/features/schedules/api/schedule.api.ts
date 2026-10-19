import { get, post, patch, del } from '@/shared/api/client';
import {
  monthlyScheduleSchema,
  dailySchedulePageSchema,
  scheduleSchema,
  type ScheduleCreateRequest,
  type ScheduleUpdateRequest,
} from '@/features/schedules/api/schedule.schema';
export const fetchMonth = (workspaceId: number, month: string, signal?: AbortSignal) =>
  get(
    `/workspaces/${workspaceId}/schedules?${new URLSearchParams({ month })}`,
    monthlyScheduleSchema,
    {
      signal,
    },
  );
export const fetchSchedule = (workspaceId: number, id: number, signal?: AbortSignal) =>
  get(`/workspaces/${workspaceId}/schedules/${id}`, scheduleSchema, { signal });
export function fetchDailySchedules(
  workspaceId: number,
  date: string,
  cursor?: string,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ date, size: '3' });
  if (cursor !== undefined) params.set('cursor', cursor);
  return get(`/workspaces/${workspaceId}/daily-schedules?${params}`, dailySchedulePageSchema, {
    signal,
  });
}
export const createSchedule = (workspaceId: number, input: ScheduleCreateRequest) =>
  post(`/workspaces/${workspaceId}/schedules`, input, scheduleSchema);
export const updateSchedule = (workspaceId: number, id: number, input: ScheduleUpdateRequest) =>
  patch(`/workspaces/${workspaceId}/schedules/${id}`, input, scheduleSchema);
export const removeSchedule = (workspaceId: number, id: number) =>
  del(`/workspaces/${workspaceId}/schedules/${id}`);
