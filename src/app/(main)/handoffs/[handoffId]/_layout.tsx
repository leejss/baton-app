import { Stack } from 'expo-router';

export default function HandoffDetailLayout() {
  return (
    <Stack screenOptions={{ gestureEnabled: false }}>
      <Stack.Screen name="index" options={{ title: '인수인계 상세' }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
    </Stack>
  );
}
