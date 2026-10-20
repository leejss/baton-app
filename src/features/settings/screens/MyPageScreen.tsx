import { ProfilePhotoControls } from '@/features/settings/components/ProfilePhotoControls';
import { logger } from '@/shared/lib/logger';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSignOut } from '@/features/auth/api/account.mutations';
import { requestNotificationPermission } from '@/features/notifications/lib/notificationPermissions';
import { EditNameDialog } from '@/features/settings/components/EditNameDialog';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { SettingsMessage } from '@/features/settings/components/SettingsMessage';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { useSettingsFeedback } from '@/features/settings/hooks/useSettingsFeedback';
import { useMainContext } from '@/features/stores/hooks/useMainContext';
import { MainHeader } from '@/features/tabs/components/MainHeader';
import { normalizeError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/lib/routes';
import { getProfileImageSource } from '@/shared/ui/profileImageAssets';
import { radius, SCREEN_PADDING_X, useTheme } from '@/theme';

export function MyPageScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { profile, canManage } = useMainContext();
  const [dialog, setDialog] = useState<'name' | 'logout' | null>(null);
  const { feedback, setFeedback } = useSettingsFeedback();
  const logout = useSignOut();
  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundDefault }]}>
      <MainHeader title="마이페이지" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Image
            source={getProfileImageSource(profile.profileImage)}
            contentFit="cover"
            accessible={false}
            style={[styles.profile, { borderColor: colors.borderSubtle }]}
          />
        </View>
        <ProfilePhotoControls />
        <SettingsSection>
          <SettingsRow label="이름" value={profile.displayName} onPress={() => setDialog('name')} />
        </SettingsSection>
        <SettingsSection title="워크스페이스" spacing="spacious">
          <SettingsRow
            label="워크스페이스 전환·추가"
            onPress={() => router.push(ROUTES.workspaces)}
          />
          <SettingsRow
            label="멤버 목록·관리"
            onPress={() => router.push(ROUTES.settings.employees)}
          />
          {canManage && (
            <SettingsRow
              label="링크로 멤버 초대"
              onPress={() => router.push(ROUTES.settings.invitations)}
            />
          )}
          {canManage && (
            <SettingsRow
              label="관리 권한 이전"
              onPress={() => router.push(ROUTES.settings.transfer())}
            />
          )}
          <SettingsRow
            label="워크스페이스 나가기"
            onPress={() => router.push(ROUTES.settings.leaveStore)}
          />
        </SettingsSection>
        <SettingsSection title="계정 관리">
          <SettingsRow
            label="알림 설정"
            onPress={() => {
              void requestNotificationPermission(
                true,
                () => useAuthStore.getState().session?.user.id === profile.id,
              ).catch((error) => {
                logger.error('알림 권한 설정 실패', error);
                setFeedback({
                  tone: 'error',
                  message: '알림 설정을 열지 못했어요. 다시 시도해주세요.',
                });
              });
            }}
          />
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
        onConfirm={() =>
          logout.mutate(undefined, {
            onError: (error) =>
              setFeedback({ tone: 'error', message: normalizeError(error).message }),
          })
        }
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
  profile: { width: 124, height: 124, borderRadius: radius.full, borderWidth: 1 },
});
