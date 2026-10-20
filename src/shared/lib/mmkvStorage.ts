import { createMMKV } from 'react-native-mmkv';

// 토큰 등 민감정보는 secureStorage에 저장한다.
export const storage = createMMKV({ id: 'app-storage' });
