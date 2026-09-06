import { Stack } from 'expo-router';

export default function HandoffDetailLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '인수인계 상세' }} />
      <Stack.Screen name="edit" options={{ title: '인수인계 수정' }} />
    </Stack>
  );
}
