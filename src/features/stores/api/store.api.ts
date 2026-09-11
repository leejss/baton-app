import { get } from '@/shared/api/client';
import { memberSchema, myStoreSchema } from '@/features/stores/api/store.schema';

export const fetchMyStore = (signal?: AbortSignal) => get('/stores/me', myStoreSchema, { signal });
export const fetchMembers = (storeId: number, signal?: AbortSignal) =>
  get(`/stores/${storeId}/members`, memberSchema.array(), { signal });
