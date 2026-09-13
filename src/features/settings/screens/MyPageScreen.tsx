import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAuthStore } from '@/features/auth/store/authStore';
import { EditNameDialog } from '@/features/settings/components/EditNameDialog';
import { ProfileAvatar } from '@/features/settings/components/ProfileAvatar';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { SettingsMessage } from '@/features/settings/components/SettingsMessage';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { useSettingsFeedback } from '@/features/settings/hooks/useSettingsFeedback';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { MainHeader } from '@/features/tabs/components/MainHeader';
import { normalizeError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/lib/routes';
import { SCREEN_PADDING_X, useTheme } from '@/theme';

export function MyPageScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { profile, canManage } = useMainContext();
  const [dialog, setDialog] = useState<'name' | 'logout' | null>(null);
  const { feedback, setFeedback } = useSettingsFeedback();
  const signOut = useAuthStore((state) => state.signOut);
  const logout = useMutation({
    mutationFn: () => signOut(),
    onError: (error) => setFeedback({ tone: 'error', message: normalizeError(error).message }),
  });
  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundDefault }]}>
      <MainHeader
        title="마이페이지"
        onBack={() => router.replace(ROUTES.home)}
        backgroundColor={colors.backgroundDefault}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <ProfileAvatar profileImage={profile.profileImage} size={124} />
        </View>
        <SettingsSection>
          <SettingsRow label="이름" value={profile.displayName} onPress={() => setDialog('name')} />
          <SettingsRow label="이메일" value={profile.email} />
        </SettingsSection>
        {canManage && (
          <SettingsSection title="직원 관리" spacing="spacious">
            <SettingsRow
              label="직원 초대"
              description="직원을 초대하고 초대 코드를 관리합니다."
              onPress={() => router.push(ROUTES.settings.invitations)}
            />
            <SettingsRow
              label="직원 관리"
              description="초대된 직원의 상태를 확인하고 관리합니다."
              onPress={() => router.push(ROUTES.settings.employees)}
            />
            <SettingsRow
              label="관리자 권한 승계"
              description="관리자 승인 및 구성원 존재 확인을 관리합니다."
              onPress={() => router.push(ROUTES.settings.transfer())}
            />
          </SettingsSection>
        )}
        <SettingsSection title="매장" spacing="compact">
          <SettingsRow
            label="매장 나가기"
            onPress={() => router.push(ROUTES.settings.leaveStore)}
          />
        </SettingsSection>
        <SettingsSection title="계정 관리">
          <SettingsRow label="로그아웃" onPress={() => setDialog('logout')} />
          <SettingsRow
            label="회원 탈퇴"
            onPress={() => router.push(ROUTES.settings.deleteAccount)}
          />
        </SettingsSection>
        {feedback && <SettingsMessage {...feedback} />}
      </ScrollView>
      {dialog === 'name' && (
        <EditNameDialog
          displayName={profile.displayName}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            setFeedback({ tone: 'success', message: '이름이 저장되었어요.' });
          }}
        />
      )}
      <SettingsDialog
        visible={dialog === 'logout'}
        title="로그아웃할까요?"
        confirmLabel="로그아웃"
        isPending={logout.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => logout.mutate()}
      >
        {logout.error && (
          <SettingsMessage tone="error" message={normalizeError(logout.error).message} />
        )}
      </SettingsDialog>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: SCREEN_PADDING_X, paddingTop: 39, paddingBottom: 43, gap: 30 },
  avatar: { alignItems: 'center' },
});
