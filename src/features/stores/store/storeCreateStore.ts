import { create } from 'zustand';
import type { CreateStoreParams, StoreContext } from '@/features/stores/api/store.schema';
type StoreCreateState = { storeName: string; createdContext: StoreContext | null };
export const STORE_CREATE_STEPS = ['name'] as const;
export type StoreCreateStep = 'name';
export const useStoreCreateStore = create<
  StoreCreateState & {
    start: () => void;
    setStoreName: (value: string) => void;
    setCreatedContext: (value: StoreContext) => void;
    clear: () => void;
  }
>((set) => ({
  storeName: '',
  createdContext: null,
  start: () => set({ storeName: '', createdContext: null }),
  setStoreName: (storeName) => set({ storeName }),
  setCreatedContext: (createdContext) => set({ createdContext }),
  clear: () => set({ storeName: '', createdContext: null }),
}));
export const getCreateStepProgress = (_step: StoreCreateStep) => ({ current: 1, total: 1 });
export const toCreateStoreParams = (state: { storeName: string }): CreateStoreParams => ({
  name: state.storeName.trim(),
});
