import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * 동기 key-value 저장소. 민감정보(토큰, 개인정보)는 여기 두지 않고
 * `expo-secure-store`(`secureStorage.ts`)를 쓴다.
 */
export const storage = createMMKV({ id: 'app-storage' });

/** zustand `persist` 미들웨어용 어댑터. */
export const mmkvStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => {
    storage.set(name, value);
  },
  removeItem: (name) => {
    storage.remove(name);
  },
};
