import { StyleSheet, View } from 'react-native';
import { SettingsArtwork } from '@/features/settings/components/SettingsArtwork';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { Button } from '@/shared/ui';
import { spacing } from '@/theme';

export function TransferRequired({
  kind,
  onCancel,
  onTransfer,
}: {
  kind: 'leave' | 'withdraw';
  onCancel: () => void;
  onTransfer: () => void;
}) {
  return (
    <SettingsLayout
      title={
        kind === 'leave' ? '지금은 매장을 나갈 수 없어요' : '회원탈퇴 전에 관리자 권한을 넘겨주세요'
      }
      description={'현재 매장에 함께 하는 직원이 있어\n관리자 권한을 먼저 넘겨야 해요'}
      onBack={onCancel}
      actions={
        <View style={styles.actions}>
          <Button label="취소" tone="weak" onPress={onCancel} />
          <View style={styles.primary}>
            <Button label="관리자 권한 승계하기" onPress={onTransfer} />
          </View>
        </View>
      }
    >
      <View style={styles.artwork}>
        <SettingsArtwork kind="warning" />
      </View>
    </SettingsLayout>
  );
}
const styles = StyleSheet.create({
  artwork: { marginTop: 64 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  primary: { flex: 1 },
});
