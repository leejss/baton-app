import { Stack } from 'expo-router';

export default function NewHandoffLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="content" />
      <Stack.Screen name="recipient" />
    </Stack>
  );
}
