import type { QueryClient } from '@tanstack/react-query';
import { homeQueries } from '@/features/home/api/home.queries';
import { scheduleQueries } from '@/features/schedules/api/schedule.queries';
import { storeQueries } from '@/features/stores/api/store.queries';
import { isAppError } from '@/shared/api/errors';
export async function invalidateScheduleViews(client: QueryClient, workspaceId: number) {
  await Promise.all([
    client.invalidateQueries({ queryKey: scheduleQueries.store(workspaceId) }),
    client.invalidateQueries({ queryKey: homeQueries.store(workspaceId) }),
  ]);
}
export async function refreshScheduleConflict(
  client: QueryClient,
  workspaceId: number,
  error: unknown,
) {
  if (isAppError(error) && [400, 403, 404, 409].includes(error.status ?? 0))
    await Promise.all([
      invalidateScheduleViews(client, workspaceId),
      client.invalidateQueries({ queryKey: storeQueries.all() }),
    ]);
}
