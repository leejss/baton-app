import { create } from 'zustand';
import type { StoreContext } from '@/features/stores/api/store.schema';
type StoreCreateState = { storeName: string; createdContext: StoreContext | null };
export const useStoreCreateStore = create<
  StoreCreateState & {
    setStoreName: (value: string) => void;
    setCreatedContext: (value: StoreContext) => void;
    clear: () => void;
  }
>((set) => ({
  storeName: '',
  createdContext: null,
  setStoreName: (storeName) => set({ storeName }),
  setCreatedContext: (createdContext) => set({ createdContext }),
  clear: () => set({ storeName: '', createdContext: null }),
}));
