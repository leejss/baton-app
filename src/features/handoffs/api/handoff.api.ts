import { get, post, patch, del } from '@/shared/api/client';
import { parseApiId } from '@/shared/api/ids';
import {
  handoffSchema,
  handoffPageSchema,
  handoffCreateRequestSchema,
  handoffUpdateRequestSchema,
  type HandoffScopeDto,
  type HandoffCreateRequestDto,
  type HandoffUpdateRequestDto,
} from '@/features/handoffs/api/handoff.schema';
export const fetchHandoffs = (
  workspaceId: number,
  scope: HandoffScopeDto,
  cursor?: string,
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams({ scope, size: '20' });
  if (cursor) query.set('cursor', cursor);
  return get(`/workspaces/${workspaceId}/handovers?${query}`, handoffPageSchema, {
    signal,
  });
};
export const fetchHandoff = (id: string | number, signal?: AbortSignal) =>
  get(`/handovers/${parseApiId(id)}`, handoffSchema, { signal });
export const createHandoff = (workspaceId: number, input: HandoffCreateRequestDto) =>
  post(
    `/workspaces/${workspaceId}/handovers`,
    handoffCreateRequestSchema.parse(input),
    handoffSchema,
  );
export const updateHandoff = (id: string | number, input: HandoffUpdateRequestDto) =>
  patch(`/handovers/${parseApiId(id)}`, handoffUpdateRequestSchema.parse(input), handoffSchema);
export const removeHandoff = (id: string | number) => del(`/handovers/${parseApiId(id)}`);
export const confirmHandoff = (id: string | number) =>
  post(`/handovers/${parseApiId(id)}/confirm`, undefined, handoffSchema);
