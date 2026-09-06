import { Stack } from 'expo-router';

export default function CreateStoreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '새 매장 만들기' }} />
      <Stack.Screen name="location" options={{ title: '매장 위치' }} />
      <Stack.Screen name="contact" options={{ title: '매장 연락처' }} />
      <Stack.Screen name="complete" options={{ title: '생성 완료' }} />
    </Stack>
  );
}
