import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useAuthStore } from '@/features/auth/store/authStore';
import { SettingsArtwork } from '@/features/settings/components/SettingsArtwork';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { ROUTES } from '@/shared/lib/routes';
import { TextLink } from '@/shared/ui';

/** 탈퇴·나가기 후 인증/활성 매장 게이트 밖에서도 볼 수 있는 완료 화면. */
export function SettingsResultScreen({ kind }: { kind: 'withdrawn' | 'left' }) {
  const router = useRouter();
  const clearReason = useAuthStore((state) => state.clearSignOutReason);
  const onFinish = () => {
    clearReason();
    router.replace(kind === 'withdrawn' ? ROUTES.auth.start : ROUTES.store);
  };
  return (
    <SettingsLayout
      title={kind === 'withdrawn' ? '회원 탈퇴 완료되었어요' : '매장에서 나갔어요'}
      description="그동안 이용해 주셔서 감사합니다."
      onBack={onFinish}
    >
      <View style={styles.artwork}>
        <SettingsArtwork kind={kind === 'withdrawn' ? 'complete' : 'leave'} />
      </View>
      <View style={styles.action}>
        <TextLink label="홈으로 가기" color="textTertiary" onPress={onFinish} />
      </View>
    </SettingsLayout>
  );
}
const styles = StyleSheet.create({
  artwork: { marginTop: 30 },
  action: { marginTop: 65, minHeight: 44, justifyContent: 'center' },
});
