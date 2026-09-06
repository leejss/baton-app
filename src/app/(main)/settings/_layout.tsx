import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '설정' }} />
      <Stack.Screen name="profile" options={{ title: '프로필 수정' }} />
      <Stack.Screen name="invitations" options={{ title: '직원 초대' }} />
      <Stack.Screen name="employees" options={{ title: '직원 관리' }} />
      <Stack.Screen name="leave-store" options={{ title: '매장 나가기' }} />
      <Stack.Screen name="transfer-admin" options={{ title: '관리자 권한 승계' }} />
      <Stack.Screen name="delete-account" options={{ title: '회원탈퇴' }} />
    </Stack>
  );
}
