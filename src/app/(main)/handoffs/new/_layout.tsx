import { Stack } from 'expo-router';

export default function NewHandoffLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '인수인계 작성' }} />
      <Stack.Screen name="content" options={{ title: '내용 작성' }} />
    </Stack>
  );
}
