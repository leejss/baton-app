import { Stack } from 'expo-router';

export default function SchedulesLayout() {
  return (
    <Stack>
      <Stack.Screen name="new" options={{ title: '근무표 등록' }} />
      <Stack.Screen name="[scheduleId]/edit" options={{ title: '근무표 수정' }} />
    </Stack>
  );
}
