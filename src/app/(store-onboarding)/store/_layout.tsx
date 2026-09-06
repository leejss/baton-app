import { Stack } from 'expo-router';

export default function StoreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '매장 시작' }} />
      <Stack.Screen name="join" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ headerShown: false }} />
    </Stack>
  );
}
