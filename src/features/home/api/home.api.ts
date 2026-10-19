import { get } from '@/shared/api/client';
import { homeSummarySchema } from '@/features/home/api/home.schema';
export const fetchHome = (workspaceId: number, date: string, signal?: AbortSignal) =>
  get(`/workspaces/${workspaceId}/home?${new URLSearchParams({ date })}`, homeSummarySchema, {
    signal,
  });
