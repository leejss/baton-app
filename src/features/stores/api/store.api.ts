import { del, get, patchVoid, post, postVoid } from '@/shared/api/client';
import {
  invitationCodeSchema,
  memberSchema,
  myStoreSchema,
  storeContextSchema,
  storeInvitationPreviewSchema,
  type CreateStoreParams,
} from '@/features/stores/api/store.schema';

export const fetchMyStore = (signal?: AbortSignal) => get('/workspaces', myStoreSchema, { signal });
export const fetchWorkspace = (workspaceId: number, signal?: AbortSignal) =>
  get(`/workspaces/${workspaceId}`, storeContextSchema, { signal });
export const fetchMembers = (workspaceId: number, signal?: AbortSignal) =>
  get(`/workspaces/${workspaceId}/members`, memberSchema.array(), { signal });
export const searchMembers = (workspaceId: number, query: string, signal?: AbortSignal) =>
  get(
    `/workspaces/${workspaceId}/members?query=${encodeURIComponent(query)}`,
    memberSchema.array(),
    { signal },
  );
export const leaveStore = (workspaceId: number) => del(`/workspaces/${workspaceId}/members/me`);
export const transferManager = (workspaceId: number, userId: number) =>
  postVoid(`/workspaces/${workspaceId}/manager-transfer`, { userId });
export const updateMemberRole = (workspaceId: number, userId: number, role: 'ADMIN' | 'MEMBER') =>
  patchVoid(`/workspaces/${workspaceId}/members/${userId}`, { role });
export const createStore = (params: CreateStoreParams, signal?: AbortSignal) =>
  post('/workspaces', params, storeContextSchema, { signal });
export const previewStoreInvitation = (token: string, signal?: AbortSignal) =>
  post('/workspaces/join/preview', { token }, storeInvitationPreviewSchema, { signal });
export const joinStore = (token: string, signal?: AbortSignal) =>
  post('/workspaces/join', { token }, storeContextSchema, { signal });
export const fetchInvitationCode = (workspaceId: number, signal?: AbortSignal) =>
  get(`/workspaces/${workspaceId}/invitation`, invitationCodeSchema.nullable(), { signal });
export const issueInvitationCode = (workspaceId: number, signal?: AbortSignal) =>
  post(`/workspaces/${workspaceId}/invitation`, { replaceCurrent: true }, invitationCodeSchema, {
    signal,
  });
