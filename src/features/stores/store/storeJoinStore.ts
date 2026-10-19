import { create } from 'zustand';
import type { StoreInvitationPreview } from '@/features/stores/api/store.schema';
import { secureStorage } from '@/shared/lib/secureStorage';
const KEY = 'workspace.pending-invitation';
let writes = Promise.resolve();
let revision = 0;
function saveToken(token: string | null) {
  writes = writes
    .catch(() => {})
    .then(() => (token ? secureStorage.set(KEY, token) : secureStorage.remove(KEY)));
  return writes;
}
export const useStoreJoinStore = create<{
  token: string | null;
  preview: StoreInvitationPreview | null;
  hydrated: boolean;
  restore: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  setPreview: (preview: StoreInvitationPreview) => void;
  clear: () => Promise<void>;
}>((set, get) => ({
  token: null,
  preview: null,
  hydrated: false,
  restore: async () => {
    const started = revision;
    try {
      await writes.catch(() => {});
      const token = await secureStorage.get(KEY);
      if (revision === started && !get().token) set({ token });
    } finally {
      set({ hydrated: true });
    }
  },
  setToken: (token) => {
    revision += 1;
    set({ token, preview: null });
    return saveToken(token);
  },
  setPreview: (preview) => set({ preview }),
  clear: () => {
    revision += 1;
    set({ token: null, preview: null });
    return saveToken(null);
  },
}));
export function invitationToken(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'baton:' || url.hostname !== 'workspace' || url.pathname !== '/join')
      return null;
    const token = url.searchParams.get('token');
    return token && /^[A-Za-z0-9_-]+$/.test(token) ? token : null;
  } catch {
    return null;
  }
}
