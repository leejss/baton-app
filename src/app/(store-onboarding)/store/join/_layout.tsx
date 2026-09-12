import { Stack } from 'expo-router';

/** 시안의 상단은 제목 없는 뒤로가기뿐이라 화면이 직접 그린다. */
export default function JoinStoreLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
