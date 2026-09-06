import { Stack } from 'expo-router';

export default function JoinStoreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '매장 참여' }} />
      <Stack.Screen name="confirm" options={{ title: '매장 확인' }} />
      <Stack.Screen name="complete" options={{ title: '참여 완료' }} />
    </Stack>
  );
}
